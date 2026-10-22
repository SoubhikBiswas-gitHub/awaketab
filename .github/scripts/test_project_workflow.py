import unittest
from project_workflow import OWNER, Workflow, deployment_status, has_owner_approval, linked_numbers, pr_status


class WorkflowTests(unittest.TestCase):
    def approval(self, actor=OWNER, event='labeled'):
        return {'event': event, 'actor': {'login': actor}, 'label': {'name': 'approved'}}

    def test_owner_approval_is_required(self):
        issue = {'labels': [{'name': 'approved'}]}
        self.assertTrue(has_owner_approval(issue, [self.approval()]))
        self.assertFalse(has_owner_approval(issue, [self.approval('contributor')]))
        self.assertFalse(has_owner_approval(issue, []))
        self.assertFalse(has_owner_approval({'labels': []}, [self.approval()]))

    def test_removal_and_readdition_cannot_reuse_approval(self):
        issue = {'labels': [{'name': 'approved'}]}
        self.assertFalse(has_owner_approval(issue, [self.approval(), self.approval(event='unlabeled'), self.approval('other')]))
        self.assertTrue(has_owner_approval(issue, [self.approval('other'), self.approval(event='unlabeled'), self.approval()]))

    def test_issue_links_are_scoped_to_this_repository(self):
        body = 'Closes #12, #13 and other/repo#14\nTracks: SoubhikBiswas-gitHub/passlore#15\nUnrelated #99'
        self.assertEqual(linked_numbers(body, OWNER + '/passlore'), [12, 13, 15])

    def test_issue_text_is_data(self):
        self.assertEqual(linked_numbers('$(curl example)\n<script>bad()</script>\nCloses #7', OWNER + '/passlore'), [7])

    def test_production_merge_is_not_a_deployment(self):
        pr = {'base': {'ref': 'main'}, 'merged': True}
        self.assertEqual(pr_status(pr, 'closed'), 'Merged')
        pr['base']['ref'] = 'play'
        self.assertEqual(pr_status(pr, 'closed'), 'In testing')

    def test_draft_review_and_abandoned_prs(self):
        pr = {'base': {'ref': 'play'}, 'draft': True, 'merged': False}
        self.assertEqual(pr_status(pr, 'opened'), 'In Progress')
        pr['draft'] = False
        self.assertEqual(pr_status(pr, 'ready_for_review'), 'In review')
        self.assertEqual(pr_status(pr, 'submitted', {'state': 'changes_requested'}), 'Changes requested')
        self.assertIsNone(pr_status(pr, 'closed'))

    def test_unrelated_branches_are_ignored(self):
        self.assertIsNone(pr_status({'base': {'ref': 'other'}}, 'opened'))

    def test_preview_is_never_production(self):
        payload = {'deployment': {'environment': 'play', 'ref': 'play', 'sha': 'abc'}, 'deployment_status': {'state': 'success'}}
        self.assertIsNone(deployment_status('deployment_status', payload))
        payload['deployment'].update(environment='production')
        self.assertIsNone(deployment_status('deployment_status', payload))

    def test_production_success_failure_and_pending_are_separate(self):
        payload = {'deployment': {'environment': 'production', 'ref': 'main', 'sha': 'abc'}, 'deployment_status': {'state': 'pending'}}
        self.assertEqual(deployment_status('deployment_status', payload), 'Deploying')
        payload['deployment_status']['state'] = 'failure'
        self.assertEqual(deployment_status('deployment_status', payload), 'Deployment failed')
        payload['deployment_status']['state'] = 'success'
        self.assertEqual(deployment_status('deployment_status', payload), 'Deployed')
        payload['deployment_status']['state'] = 'inactive'
        self.assertIsNone(deployment_status('deployment_status', payload))

    def test_only_cloudflare_main_check_can_confirm_delivery(self):
        check = {'app': {'slug': 'cloudflare-workers-and-pages'}, 'name': 'Cloudflare Pages',
                 'check_suite': {'head_branch': 'main'}, 'status': 'completed', 'conclusion': 'success'}
        self.assertEqual(deployment_status('check_run', {'check_run': check}), 'Deployed')
        check['app']['slug'] = 'untrusted'
        self.assertIsNone(deployment_status('check_run', {'check_run': check}))
        check['app']['slug'] = 'cloudflare-workers-and-pages'
        check['check_suite']['head_branch'] = 'play'
        self.assertIsNone(deployment_status('check_run', {'check_run': check}))

    def test_unauthorized_approval_is_removed_without_project_access(self):
        class FakeApi:
            calls = []
            def request(self, method, path, data=None):
                self.calls.append((method, path))
                if method == 'GET':
                    return {'number': 3, 'labels': [{'name': 'approved'}]}
        api = FakeApi()
        Workflow(OWNER + '/passlore', api, None, None).run('issues', {
            'action': 'labeled', 'issue': {'number': 3}, 'label': {'name': 'approved'}, 'sender': {'login': 'other'}})
        self.assertEqual(api.calls[-1], ('DELETE', '/repos/' + OWNER + '/passlore/issues/3/labels/approved'))


    def test_owner_approval_creates_task_and_unapproved_issue_does_not(self):
        class FakeApi:
            def request(self, method, path, data=None):
                return {'number': 3, 'labels': [{'name': 'approved'}], 'node_id': 'issue3'}
        class RecordingWorkflow(Workflow):
            permitted = True
            updates = []
            def approved(self, issue):
                return self.permitted
            def set_status(self, issue, status):
                self.updates.append((issue['number'], status))
        workflow = RecordingWorkflow(OWNER + '/passlore', FakeApi(), None, '1')
        event = {'action': 'labeled', 'issue': {'number': 3}, 'label': {'name': 'approved'}, 'sender': {'login': OWNER}}
        workflow.run('issues', event)
        self.assertEqual(workflow.updates, [(3, 'Approved')])
        workflow.permitted = False
        workflow.run('issues', event)
        self.assertEqual(workflow.updates, [(3, 'Approved')])

    def test_missing_project_configuration_fails_visibly(self):
        workflow = Workflow(OWNER + '/passlore', None, None, None)
        with self.assertRaisesRegex(RuntimeError, 'PROJECT_NUMBER and PROJECTS_TOKEN'):
            workflow.set_status({'number': 1, 'node_id': 'issue1'}, 'Approved')

    def test_privileged_workflow_never_checks_out_contributor_head(self):
        from pathlib import Path
        workflow = (Path(__file__).parent.parent / 'workflows/contribution-lifecycle.yml').read_text()
        self.assertIn('ref: ${{ github.event.repository.default_branch }}', workflow)
        self.assertIn('persist-credentials: false', workflow)
        self.assertNotIn('pull_request.head', workflow)
        self.assertNotIn('github.head_ref', workflow)


if __name__ == '__main__':
    unittest.main()
