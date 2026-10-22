import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

OWNER = 'SoubhikBiswas-gitHub'
STAGES = {
    'needs-information': 'Needs information',
    'ready': 'Ready',
    'in-progress': 'In Progress',
    'blocked': 'Blocked',
    'not-planned': 'Not planned',
}
STATUSES = ['Inbox', 'Needs information', 'Approved', 'Ready', 'In Progress',
            'In review', 'Changes requested', 'Blocked', 'In testing', 'Merged',
            'Deploying', 'Deployment failed', 'Deployed', 'Not planned']


class Api:
    def __init__(self, token):
        self.token = token

    def request(self, method, path, data=None):
        url = path if path.startswith('https://api.github.com/') else 'https://api.github.com' + path
        request = urllib.request.Request(url, method=method, headers={
            'Authorization': 'Bearer ' + self.token,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'Contribution-workflow',
        }, data=None if data is None else json.dumps(data).encode())
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read()
        return json.loads(body) if body else None

    def pages(self, path):
        separator = '&' if '?' in path else '?'
        for page in range(1, 101):
            values = self.request('GET', f'{path}{separator}per_page=100&page={page}')
            yield from values
            if len(values) < 100:
                return
        raise RuntimeError('Pagination limit reached; no partial update was accepted.')

    def graphql(self, query, **variables):
        result = self.request('POST', '/graphql', {'query': query, 'variables': variables})
        if result.get('errors'):
            raise RuntimeError('; '.join(e['message'] for e in result['errors']))
        return result['data']


def has_owner_approval(issue, events):
    if 'approved' not in {label['name'] for label in issue['labels']}:
        return False
    authorized = False
    for event in events:
        if event.get('label', {}).get('name') != 'approved':
            continue
        if event['event'] == 'labeled':
            authorized = event.get('actor', {}).get('login') == OWNER
        elif event['event'] == 'unlabeled':
            authorized = False
    return authorized


def linked_numbers(body, repo):
    numbers = set()
    expression = r'(?im)\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|tracks)\s*:?\s+([^\n]+)'
    for match in re.finditer(expression, body or ''):
        for ref in re.finditer(r'(?<![\w/])(?:(?P<repo>[\w.-]+/[\w.-]+))?#(?P<number>\d+)\b', match[1]):
            if ref['repo'] is None or ref['repo'].lower() == repo.lower():
                numbers.add(int(ref['number']))
    return sorted(numbers)


def pr_status(pr, action, review=None):
    if pr['base']['ref'] not in ('play', 'main'):
        return None
    if action == 'closed':
        if pr.get('merged'):
            return 'Merged' if pr['base']['ref'] == 'main' else 'In testing'
        return None
    if review and review.get('state') == 'changes_requested':
        return 'Changes requested'
    if pr.get('draft'):
        return 'In Progress'
    return 'In review'


def deployment_status(event_name, payload):
    if event_name == 'deployment_status':
        deployment = payload['deployment']
        if deployment.get('environment', '').lower() != 'production':
            return None
        if deployment.get('ref') not in ('main', deployment['sha']):
            return None
        state = payload['deployment_status']['state']
        return {'success': 'Deployed', 'failure': 'Deployment failed',
                'error': 'Deployment failed', 'in_progress': 'Deploying',
                'queued': 'Deploying', 'pending': 'Deploying'}.get(state)
    if event_name == 'check_run':
        check = payload['check_run']
        if (check.get('app', {}).get('slug') != 'cloudflare-workers-and-pages'
                or check['name'] != 'Cloudflare Pages'
                or check.get('check_suite', {}).get('head_branch') != 'main'):
            return None
        if check['status'] != 'completed':
            return 'Deploying'
        return {'success': 'Deployed', 'failure': 'Deployment failed',
                'timed_out': 'Deployment failed', 'cancelled': 'Deployment failed'}.get(check['conclusion'])
    return None


class Workflow:
    def __init__(self, repo, api, projects, project_number):
        self.repo = repo
        self.api = api
        self.projects = projects
        self.project_number = project_number
        self.project = None

    def issue(self, number):
        return self.api.request('GET', f'/repos/{self.repo}/issues/{number}')

    def approved(self, issue):
        events = self.api.pages(f'/repos/{self.repo}/issues/{issue["number"]}/events')
        return has_owner_approval(issue, events)

    def project_config(self):
        if not self.project:
            if not self.project_number or not self.projects:
                raise RuntimeError('Configure PROJECT_NUMBER and PROJECTS_TOKEN to connect the board.')
            result = self.projects.graphql('''query($login:String!,$number:Int!){
              user(login:$login){projectV2(number:$number){id fields(first:100){nodes{
                ... on ProjectV2SingleSelectField{id name options{id name}}
              }}}}}''', login=OWNER, number=int(self.project_number))
            self.project = result['user']['projectV2']
            if not self.project:
                raise RuntimeError('Configured project was not found.')
        return self.project

    def set_status(self, issue, status):
        project = self.project_config()
        field = next(f for f in project['fields']['nodes'] if f.get('name') == 'Status')
        option = next((o for o in field['options'] if o['name'] == status), None)
        if not option:
            raise RuntimeError('Missing board status: ' + status)
        result = self.projects.graphql('''mutation($project:ID!,$content:ID!){
          addProjectV2ItemById(input:{projectId:$project,contentId:$content}){item{id}}}
        ''', project=project['id'], content=issue['node_id'])
        item = result['addProjectV2ItemById']['item']['id']
        self.projects.graphql('''mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){
          updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,
            fieldId:$field,value:{singleSelectOptionId:$option}}){projectV2Item{id}}}
        ''', project=project['id'], item=item, field=field['id'], option=option['id'])
        print(f'Issue #{issue["number"]}: {status}')

    def existing_item_status(self, issue, status=None):
        project = self.project_config()
        cursor = None
        while True:
            result = self.projects.graphql('''query($id:ID!,$cursor:String){node(id:$id){
              ... on Issue{projectItems(first:100,after:$cursor){nodes{id project{id}}
                pageInfo{hasNextPage endCursor}}}}}''', id=issue['node_id'], cursor=cursor)
            items = result['node']['projectItems']
            if any(item['project']['id'] == project['id'] for item in items['nodes']):
                if status:
                    self.set_status(issue, status)
                return True
            if not items['pageInfo']['hasNextPage']:
                return False
            cursor = items['pageInfo']['endCursor']

    def references(self, pr):
        numbers = set(linked_numbers(pr.get('body'), self.repo))
        cursor = None
        while True:
            result = self.api.graphql('''query($owner:String!,$name:String!,$number:Int!,$cursor:String){
              repository(owner:$owner,name:$name){pullRequest(number:$number){
                closingIssuesReferences(first:100,after:$cursor){nodes{number repository{nameWithOwner}}
                  pageInfo{hasNextPage endCursor}}}}}''', owner=OWNER,
                name=self.repo.split('/')[1], number=pr['number'], cursor=cursor)
            connection = result['repository']['pullRequest']['closingIssuesReferences']
            numbers.update(i['number'] for i in connection['nodes']
                           if i['repository']['nameWithOwner'].lower() == self.repo.lower())
            if not connection['pageInfo']['hasNextPage']:
                return sorted(numbers)
            cursor = connection['pageInfo']['endCursor']

    def update_pr(self, pr, status, require_merge=False):
        if not status or (require_merge and not pr.get('merged_at')):
            return
        for number in self.references(pr):
            issue = self.issue(number)
            if self.approved(issue):
                self.set_status(issue, status)

    def delivery(self, sha, status):
        main = self.api.request('GET', f'/repos/{self.repo}/commits/main')['sha']
        comparison = self.api.request('GET', f'/repos/{self.repo}/compare/{sha}...{main}')
        if comparison['status'] not in ('ahead', 'identical'):
            return
        pulls = self.api.pages(f'/repos/{self.repo}/commits/{sha}/pulls')
        for pr in pulls:
            if pr['base']['ref'] == 'main' and pr.get('merged_at') and pr.get('merge_commit_sha') == sha:
                self.update_pr(pr, status, require_merge=True)

    def run(self, event_name, payload):
        action = payload.get('action')
        if event_name == 'issues':
            issue = self.issue(payload['issue']['number'])
            label = payload.get('label', {}).get('name')
            actor = payload.get('sender', {}).get('login')
            if action == 'labeled' and label in {'approved', *STAGES} and actor != OWNER:
                encoded = urllib.parse.quote(label, safe='')
                self.api.request('DELETE', f'/repos/{self.repo}/issues/{issue["number"]}/labels/{encoded}')
                print('Rejected owner-only label from another account.')
                return
            approved = self.approved(issue)
            if not approved:
                if action == 'unlabeled' and label == 'approved':
                    self.existing_item_status(issue, 'Inbox')
                return
            status = None
            if action == 'labeled' and actor == OWNER:
                status = 'Approved' if label == 'approved' else STAGES.get(label)
            elif action == 'reopened':
                status = 'Approved'
            elif action == 'closed' and issue.get('state_reason') == 'not_planned':
                status = 'Not planned'
            if status:
                self.set_status(issue, status)
        elif event_name in ('pull_request_target', 'pull_request_review'):
            event_pr = payload['pull_request']
            pr = self.api.request('GET', f'/repos/{self.repo}/pulls/{event_pr["number"]}')
            status = pr_status(pr, action, payload.get('review'))
            if payload.get('review') and payload.get('sender', {}).get('login') != OWNER:
                return
            self.update_pr(pr, status)
        elif event_name in ('check_run', 'deployment_status'):
            if event_name == 'check_run':
                if payload['check_run'].get('app', {}).get('slug') != 'cloudflare-workers-and-pages':
                    return
                check = self.api.request('GET', f'/repos/{self.repo}/check-runs/{payload["check_run"]["id"]}')
                payload['check_run'] = check
                suite = self.api.request('GET', f'/repos/{self.repo}/check-suites/{check["check_suite"]["id"]}')
                check['check_suite'] = suite
            status = deployment_status(event_name, payload)
            if status:
                sha = payload['check_run']['head_sha'] if event_name == 'check_run' else payload['deployment']['sha']
                self.delivery(sha, status)
        elif event_name == 'workflow_run':
            run = payload['workflow_run']
            if (run['head_branch'] != 'main' or run['event'] != 'push'
                    or run['name'] != 'Passlore checks and deployment'):
                return
            job_data = self.api.request('GET', f'/repos/{self.repo}/actions/runs/{run["id"]}/jobs?per_page=100')
            if job_data['total_count'] > 100:
                raise RuntimeError('Unexpected number of deployment jobs.')
            deploy = next((j for j in job_data['jobs'] if j['name'] == 'Deploy'), None)
            if deploy and deploy['conclusion'] in ('success', 'failure', 'timed_out'):
                self.delivery(run['head_sha'], 'Deployed' if deploy['conclusion'] == 'success' else 'Deployment failed')
        elif event_name == 'workflow_dispatch':
            if payload.get('sender', {}).get('login') != OWNER:
                raise RuntimeError('Only the repository owner may reconcile the board.')
            for issue in self.api.pages(f'/repos/{self.repo}/issues?state=open&labels=approved'):
                if 'pull_request' not in issue and self.approved(issue):
                    if not self.existing_item_status(issue):
                        self.set_status(issue, 'Approved')


def main():
    repo = os.environ['GITHUB_REPOSITORY']
    if repo.split('/')[0] != OWNER:
        raise RuntimeError('Owner approval is configured for the original repository only.')
    with open(os.environ['GITHUB_EVENT_PATH']) as handle:
        payload = json.load(handle)
    project_token = os.environ.get('PROJECTS_TOKEN')
    Workflow(repo, Api(os.environ['GITHUB_TOKEN']), Api(project_token) if project_token else None,
             os.environ.get('PROJECT_NUMBER')).run(os.environ['GITHUB_EVENT_NAME'], payload)


if __name__ == '__main__':
    main()
