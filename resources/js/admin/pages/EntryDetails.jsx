import { useState } from 'react';
import { AdMobManager } from '../managers/AdMobManager';
import { AppVersionManager } from '../managers/AppVersionManager';
import { DeviceManager } from '../managers/DeviceManager';
import { EngagementManager } from '../managers/EngagementManager';
import { FaqManager } from '../managers/FaqManager';
import { FcmSettings } from '../managers/FcmSettings';
import { FeedbackManager } from '../managers/FeedbackManager';
import { FeatureRequestManager } from '../managers/FeatureRequestManager';
import { MarketingManager } from '../managers/MarketingManager';
import { MembershipManager } from '../managers/MembershipManager';
import { NotesManager } from '../managers/NotesManager';
import { NotificationManager } from '../managers/NotificationManager';
import { PagesManager } from '../managers/PagesManager';
import { PlanManager } from '../managers/PlanManager';
import { SmtpSettings } from '../managers/SmtpSettings';
import { FileManager } from './FileManager';

const screenTitles = {
  plans:          'Plans',
  memberships:    'Memberships',
  notifications:  'Notifications',
  fcm:            'FCM Settings',
  smtp:           'SMTP Settings',
  admob:          'AdMob Settings',
  users:          'Active Users',
  pages:          'Pages',
  files:          'File Manager',
  notes:          'Notes',
  faqs:           'FAQs',
  engagement:     'Feedback / Features',
  feedback:       'Feedback & Bug Reports',
  features:       'Feature Requests',
  marketing:      'Marketing & Revenue',
  'app-version':  'App Version & Force Update',
};

export function EntryDetails({ selectedEntry, details, detailTab, moduleAction, moduleItemId, reloadDetails, reloadAll, navigateModule }) {
  const [headerAction, setHeaderAction] = useState(null);

  const content = renderTab(detailTab, { selectedEntry, details, moduleAction, moduleItemId, reloadDetails, reloadAll, setHeaderAction, navigateModule });

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
            {screenTitles[detailTab] || 'Plans'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {selectedEntry.title} / {selectedEntry.application_id}
          </p>
        </div>
        {headerAction}
      </div>
      {/* key forces full remount on tab change — resets all internal manager state */}
      <div key={detailTab} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {content}
      </div>
    </>
  );
}

function renderTab(tab, { selectedEntry, details, moduleAction, moduleItemId, reloadDetails, reloadAll, setHeaderAction, navigateModule }) {
  const routeProps = { moduleAction, moduleItemId, navigateModule };
  switch (tab) {
    case 'plans':
      return <PlanManager entry={selectedEntry} items={details.plans || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'memberships':
      return <MembershipManager entry={selectedEntry} items={details.memberships || []} plans={details.plans || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'notifications':
      return <NotificationManager entry={selectedEntry} items={details.notifications || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'fcm':
      return <FcmSettings entry={selectedEntry} items={details.notification_settings || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />;
    case 'smtp':
      return <SmtpSettings entry={selectedEntry} setting={details.smtp_setting || null} reload={reloadDetails} setHeaderAction={setHeaderAction} />;
    case 'users':
      return <DeviceManager items={details.devices || []} reload={async () => { await reloadDetails(); await reloadAll(); }} />;
    case 'pages':
      return <PagesManager entry={selectedEntry} items={details.pages || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'files':
      return <FileManager entry={selectedEntry} />;
    case 'notes':
      return <NotesManager entry={selectedEntry} items={details.notes || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'faqs':
      return <FaqManager entry={selectedEntry} items={details.faqs || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'engagement':
      return (
        <EngagementManager
          entry={selectedEntry}
          feedbackItems={details.feedbacks || []}
          featureItems={details.feature_requests || []}
          reload={reloadDetails}
          setHeaderAction={setHeaderAction}
        />
      );
    case 'feedback':
      return <FeedbackManager entry={selectedEntry} items={details.feedbacks || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'features':
      return <FeatureRequestManager entry={selectedEntry} items={details.feature_requests || []} reload={reloadDetails} setHeaderAction={setHeaderAction} {...routeProps} />;
    case 'marketing':
      return <MarketingManager entry={selectedEntry} setHeaderAction={setHeaderAction} />;
    case 'admob':
      return <AdMobManager entry={selectedEntry} reload={reloadDetails} />;
    case 'app-version':
      return <AppVersionManager entry={selectedEntry} reload={reloadDetails} />;
    default:
      return <PlanManager entry={selectedEntry} items={details.plans || []} reload={reloadDetails} setHeaderAction={setHeaderAction} />;
  }
}
