import { useState } from 'react';
import { makeCx } from '../../lib/cx';
import * as store from '../../lib/store';
import adminStyles from '../../styles/admin.module.css';
import { useToast } from '../common/Toast';
import AdminShell, { AdminHeader } from './AdminShell';

const cx = makeCx(adminStyles);

/*
 * Settings are saved in localStorage as:
 * aquapro_admin_settings = { [sectionIndex]: [fieldValue, ...] }
 * (store.getDeliveryFee reads section 1, field 0).
 */
const SECTIONS = [
  {
    title: 'Station Profile',
    icon: 'fa-store',
    fields: [
      { label: 'Station Name', type: 'text', value: 'Aqua Fresh Station' },
      { label: 'Station Address', type: 'text', value: '123 Main St., Catarman, Northern Samar' },
      { label: 'Contact Number', type: 'text', value: '(055) 123-4567', row: 'contact' },
      { label: 'Email', type: 'email', value: 'aquafresh@aquapro.ph', row: 'contact' },
    ],
  },
  {
    title: 'Delivery Settings',
    icon: 'fa-truck',
    fields: [
      { label: 'Default Delivery Fee', type: 'number', value: '20', step: '0.01', row: 'fees' },
      { label: 'Max Delivery Distance (km)', type: 'number', value: '10', row: 'fees' },
      { label: 'Morning (8:00 AM - 12:00 PM)', type: 'checkbox', value: true, group: 'Delivery Time Slots' },
      { label: 'Afternoon (12:00 PM - 5:00 PM)', type: 'checkbox', value: true, group: 'Delivery Time Slots' },
    ],
  },
  {
    title: 'Notification Settings',
    icon: 'fa-bell',
    fields: [
      { label: 'Email notifications for new orders', type: 'toggle', value: true },
      { label: 'SMS alerts for low stock', type: 'toggle', value: true },
      { label: 'Daily summary reports', type: 'toggle', value: false },
    ],
  },
  {
    title: 'Admin Account',
    icon: 'fa-user-shield',
    button: 'Update Account',
    fields: [
      { label: 'Admin Name', type: 'text', value: 'Maria Santos' },
      { label: 'Email', type: 'email', value: 'admin@aquapro.ph' },
      { label: 'Change Password', type: 'password', value: '', placeholder: 'New password' },
    ],
  },
];

function loadValues() {
  const saved = store.getSettings();
  return SECTIONS.map((section, si) =>
    section.fields.map((field, fi) => {
      const v = saved[si]?.[fi];
      if (v === null || v === undefined || field.type === 'password') return field.value;
      return v;
    }),
  );
}

function SettingsCard({ section, index, values, onChange, onSave, saved }) {
  const { fields } = section;
  const input = (field, fi) => {
    const common = { value: values[fi], onChange: (e) => onChange(fi, e.target.value) };
    return (
      <input type={field.type} className={cx('form-control')} step={field.step} placeholder={field.placeholder} {...common} />
    );
  };

  const blocks = [];
  for (let fi = 0; fi < fields.length; fi += 1) {
    const field = fields[fi];
    if (field.row) {
      const rowFields = fields.map((f, i) => [f, i]).filter(([f]) => f.row === field.row);
      blocks.push(
        <div className={cx('form-row')} key={`row-${fi}`}>
          {rowFields.map(([f, i]) => (
            <div className={cx('form-group')} key={i}>
              <label>{f.label}</label>
              {input(f, i)}
            </div>
          ))}
        </div>,
      );
      fi += rowFields.length - 1;
    } else if (field.group) {
      const groupFields = fields.map((f, i) => [f, i]).filter(([f]) => f.group === field.group);
      blocks.push(
        <div className={cx('form-group')} key={`group-${fi}`}>
          <label>{field.group}</label>
          <div className={cx('checkbox-group')}>
            {groupFields.map(([f, i]) => (
              <label key={i}>
                <input type="checkbox" checked={Boolean(values[i])} onChange={(e) => onChange(i, e.target.checked)} /> {f.label}
              </label>
            ))}
          </div>
        </div>,
      );
      fi += groupFields.length - 1;
    } else if (field.type === 'toggle') {
      blocks.push(
        <div className={cx('form-group')} key={fi}>
          <label className={cx('toggle-switch')}>
            <input type="checkbox" checked={Boolean(values[fi])} onChange={(e) => onChange(fi, e.target.checked)} />
            <span>{field.label}</span>
          </label>
        </div>,
      );
    } else {
      blocks.push(
        <div className={cx('form-group')} key={fi}>
          <label>{field.label}</label>
          {input(field, fi)}
        </div>,
      );
    }
  }

  return (
    <div className={cx('card')}>
      <div className={cx('card-header')}>
        <h3><i className={cx('fas', section.icon)}></i> {section.title}</h3>
      </div>
      <div className={cx('card-body')}>
        {blocks}
        <button type="button" className={cx('btn btn-primary')} disabled={saved} onClick={() => onSave(index)}>
          {saved ? 'Saved!' : section.button || 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const showToast = useToast();
  const [values, setValues] = useState(loadValues);
  const [savedIndex, setSavedIndex] = useState(null);

  function change(si, fi, value) {
    setValues((all) => all.map((section, i) => (i === si ? section.map((v, j) => (j === fi ? value : v)) : section)));
  }

  function save(si) {
    const settings = store.getSettings();
    settings[si] = SECTIONS[si].fields.map((f, fi) => (f.type === 'password' ? null : values[si][fi]));
    store.saveSettings(settings);
    showToast(`${SECTIONS[si].title} settings saved in this browser.`, 'success');
    setSavedIndex(si);
    setTimeout(() => setSavedIndex(null), 1200);
  }

  return (
    <AdminShell cx={cx}>
      <AdminHeader cx={cx} title="Settings" subtitle="Configure your AquaPro system" />
      <div className={cx('settings-container')}>
        {SECTIONS.map((section, si) => (
          <SettingsCard
            key={section.title}
            section={section}
            index={si}
            values={values[si]}
            onChange={(fi, v) => change(si, fi, v)}
            onSave={save}
            saved={savedIndex === si}
          />
        ))}
      </div>
    </AdminShell>
  );
}
