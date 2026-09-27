import catalogs from 'virtual:at-catalogs-bg';
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import type { IExtApi } from '../src/api';
import { createController } from '../src/controller';
import { mockPower } from '../src/test-hooks';

/**
 * MV3 service worker (docs/10 §4). Every listener is registered synchronously on start so Chrome can wake
 * the worker for it; the controller loads chrome.storage lazily on the first event and re-hydrates the
 * session, re-issuing the keep-awake request.
 */
export default defineBackground({
  type: 'module',
  main() {
    const real = browser as unknown as IExtApi;
    const api: IExtApi = __AT_TEST__
      ? (Object.create(real, { power: { value: mockPower(real.storage.session, real.storage.onChanged) } }) as IExtApi)
      : real;
    const ctl = createController({ api, catalogs });
    const run = (task: Promise<unknown>) => {
      task.catch((error: unknown) => {
        console.error('[AwakeTab]', error);
      });
    };

    api.runtime.onStartup.addListener(() => {
      run(ctl.onStartup());
    });
    api.runtime.onInstalled.addListener((details) => {
      run(ctl.onInstalled(details.reason, details.previousVersion));
    });
    api.alarms.onAlarm.addListener((alarm) => {
      run(ctl.onAlarm(alarm.name));
    });
    api.commands.onCommand.addListener((command) => {
      run(ctl.onCommand(command));
    });
    api.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Only this extension's own pages talk to the worker (no externally_connectable, no content scripts).
      if ((sender as { id?: string } | undefined)?.id !== api.runtime.id) return undefined;
      ctl.onMessage(message).then(sendResponse, () => {
        sendResponse(null);
      });
      return true;
    });
    api.storage.onChanged.addListener((changes, areaName) => {
      run(ctl.onStorageChanged(changes, areaName));
    });
    api.tabs.onUpdated.addListener((tabId, change, tab) => {
      run(ctl.onTabUpdated(tabId, change, tab));
    });
    api.tabs.onRemoved.addListener((tabId) => {
      run(ctl.onTabRemoved(tabId));
    });
    api.permissions.onRemoved.addListener(() => {
      run(ctl.onPermissionsRemoved());
    });

    // `notifications` is optional: its events exist only once the permission is granted.
    let notificationsBound = false;
    const bindNotifications = () => {
      const notifications = api.notifications;
      if (!notifications || notificationsBound) return;
      notificationsBound = true;
      notifications.onButtonClicked.addListener((id, index) => {
        run(ctl.onNotificationButton(id, index));
      });
      notifications.onClicked.addListener((id) => {
        run(ctl.onNotificationClicked(id));
      });
    };
    bindNotifications();
    api.permissions.onAdded.addListener(bindNotifications);

    run(ctl.ready());
  },
});
