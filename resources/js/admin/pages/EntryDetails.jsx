import { useState } from 'react';
import { DeviceManager } from '../managers/DeviceManager';
import { FcmSettings } from '../managers/FcmSettings';
import { MembershipManager } from '../managers/MembershipManager';
import { NotificationManager } from '../managers/NotificationManager';
import { PlanManager } from '../managers/PlanManager';
import { PagesManager } from '../managers/PagesManager';
import { FileManager } from './FileManager';

const screenTitles = {
  plans: 'Plans',
  memberships: 'Memberships',
  notifications: 'Notifications',
  fcm: 'FCM Settings',
  users: 'Active Users',
  pages: 'Pages',
  files: 'File Manager',
};

export function EntryDetails({ selectedEntry, details, detailTab, reloadDetails, reloadAll }) {
  const [headerAction, setHeaderAction] = useState(null);
  const screenContent = {
    plans: <PlanManager entry={selectedEntry} items={details.plans || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    memberships: <MembershipManager entry={selectedEntry} items={details.memberships || []} plans={details.plans || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    notifications: <NotificationManager entry={selectedEntry} items={details.notifications || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    fcm: <FcmSettings entry={selectedEntry} items={details.notification_settings || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    users: <DeviceManager items={details.devices || []} reload={async () => { await reloadDetails(); await reloadAll(); }} />,
    pages: <PagesManager entry={selectedEntry} items={details.pages || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    files: <FileManager entry={selectedEntry} />,
  };

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">{screenTitles[detailTab] || 'Plans'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedEntry.title} / {selectedEntry.application_id}
          </p>
        </div>
        {headerAction}
      </div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {screenContent[detailTab] || screenContent.plans}
      </div>
    </>
  );
}
