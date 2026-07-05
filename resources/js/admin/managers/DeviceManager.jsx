import { ActionGroup, DataRows, DeleteButton } from '../components/DataRows';

export function DeviceManager({ items, reload }) {
  return (
    <DataRows
      items={items}
      columns={['email', 'device_id', 'last_seen_at']}
      actions={(item) => (
        <ActionGroup>
          <DeleteButton url={`/admin-api/devices/${item.id}`} reload={reload} />
        </ActionGroup>
      )}
    />
  );
}
