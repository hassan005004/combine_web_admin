import { useState } from 'react';
import { FeedbackManager } from './FeedbackManager';
import { FeatureRequestManager } from './FeatureRequestManager';

export function EngagementManager({ entry, feedbackItems, featureItems, reload, setHeaderAction }) {
  const [tab, setTab] = useState('feedback');

  return (
    <div>
      <div className="flex border-b border-gray-100 dark:border-gray-700">
        {[
          ['feedback', 'Feedback / Bugs'],
          ['features', 'Feature Requests'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              tab === key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'feedback' ? (
        <FeedbackManager entry={entry} items={feedbackItems} reload={reload} setHeaderAction={setHeaderAction} />
      ) : (
        <FeatureRequestManager entry={entry} items={featureItems} reload={reload} setHeaderAction={setHeaderAction} />
      )}
    </div>
  );
}
