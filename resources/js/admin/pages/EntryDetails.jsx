import { useState } from 'react';
import { DeviceManager } from '../managers/DeviceManager';
import { FcmSettings } from '../managers/FcmSettings';
import { FeatureManager } from '../managers/FeatureManager';
import { MembershipManager } from '../managers/MembershipManager';
import { NotificationManager } from '../managers/NotificationManager';
import { PlanManager } from '../managers/PlanManager';

const screenTitles = {
  plans: 'Plans',
  memberships: 'Memberships',
  features: 'Features',
  notifications: 'Notifications',
  fcm: 'FCM Settings',
  users: 'Active Users',
};

export function EntryDetails({ selectedEntry, details, detailTab, reloadDetails, reloadAll }) {
  const [headerAction, setHeaderAction] = useState(null);
  const screenContent = {
    plans: <PlanManager entry={selectedEntry} items={details.plans || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    memberships: <MembershipManager entry={selectedEntry} items={details.memberships || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    features: <FeatureManager entry={selectedEntry} items={details.features || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    notifications: <NotificationManager entry={selectedEntry} items={details.notifications || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />,
    fcm: <FcmSettings entry={selectedEntry} items={details.notification_settings || []} reload={reloadDetails} />,
    users: <DeviceManager items={details.devices || []} reload={async () => { await reloadDetails(); await reloadAll(); }} />,
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
