import { useCallback, useEffect, useState } from 'react';
import {
  RiAddLine,
  RiAdminLine,
  RiDeleteBinLine,
  RiEditLine,
  RiLockPasswordLine,
  RiShieldStarLine,
  RiUserStarLine,
} from 'react-icons/ri';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { createAdmin, deleteAdmin, getAdmins, updateAdmin } from '../services/api';
import { formatDate, getInitials, readList, toastMessage } from '../utils/format';

const inputClass =
  'w-full bg-bg-raised border border-border rounded-input px-4 py-3 text-white text-sm outline-none focus:border-primary transition-colors duration-200 placeholder:text-muted';
const labelClass = 'block text-muted text-xs font-bold uppercase tracking-wider mb-2';

const emptyForm = { name: '', email: '', phone: '', password: '' };

const AdminsPage = () => {
  const { admin: me } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdmins();
      setAdmins(readList(res.data, ['admins', 'data']));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admins.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const openAddModal = () => {
    setFormError('');
    setForm(emptyForm);
    setAddOpen(true);
  };

  const openEditModal = (admin) => {
    setFormError('');
    setForm({ name: admin.name || '', email: admin.email || '', phone: admin.phone || '', password: '' });
    setEditTarget(admin);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Name, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await createAdmin({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });
      toastMessage('Admin created successfully.');
      setAddOpen(false);
      loadAdmins();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (form.password && form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone };
      if (form.password) payload.password = form.password;
      await updateAdmin(editTarget._id, payload);
      toastMessage('Admin profile updated.');
      setEditTarget(null);
      loadAdmins();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to update admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLastSuperAdmin = (admin) =>
    admin.role === 'super_admin' && admins.filter((a) => a.role === 'super_admin').length === 1;

  const handleDelete = async (admin) => {
    const message =
      admin.role === 'super_admin'
        ? 'Delete this super admin account? This cannot be undone.'
        : 'Delete this admin account? They will lose access immediately.';
    if (!window.confirm(message)) return;
    try {
      await deleteAdmin(admin._id);
      toastMessage('Admin removed.');
      loadAdmins();
    } catch (err) {
      toastMessage(err.response?.data?.message || 'Unable to remove admin.');
    }
  };

  const isSelf = (admin) => me && String(admin._id) === String(me.id || me._id);

  const columns = [
    { key: 'index', header: '#', render: (_, index) => index + 1 },
    {
      key: 'name',
      header: 'Admin',
      render: (admin) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
            {getInitials(admin.name || admin.email)}
          </div>
          <div>
            <div className="font-semibold text-white">
              {admin.name} {isSelf(admin) && <span className="text-muted text-xs font-normal">(you)</span>}
            </div>
            <div className="text-muted text-xs">{admin.email || 'N/A'}</div>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (admin) => admin.phone || 'N/A' },
    {
      key: 'role',
      header: 'Role',
      render: (admin) => (
        <Badge
          label={admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          type={admin.role === 'super_admin' ? 'info' : 'default'}
        />
      ),
    },
    { key: 'joined', header: 'Joined', render: (admin) => formatDate(admin.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (admin) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEditModal(admin)}
            disabled={isSelf(admin)}
            className="p-1.5 text-muted hover:text-info transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Edit admin"
            title={isSelf(admin) ? 'Edit your own profile in Settings' : 'Edit admin'}
          >
            <RiEditLine />
          </button>
          <button
            onClick={() => handleDelete(admin)}
            disabled={isSelf(admin) || isLastSuperAdmin(admin)}
            className="p-1.5 text-muted hover:text-danger transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Delete admin"
            title={isLastSuperAdmin(admin) ? 'Cannot delete the last super admin' : 'Delete admin'}
          >
            <RiDeleteBinLine />
          </button>
        </div>
      ),
    },
  ];

  const stats = {
    total: admins.length,
    superAdmins: admins.filter((a) => a.role === 'super_admin').length,
    standard: admins.filter((a) => a.role === 'admin').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-xl font-black">Admins</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-text rounded-input px-4 py-2 text-sm font-bold hover:bg-amber-400 transition-colors"
        >
          <RiAddLine /> Add Admin
        </button>
      </div>

      {error && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3 mb-6">{error}</div>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card">
          <RiAdminLine className="text-primary text-xl mb-1" />
          <div className="text-white text-2xl font-black">{stats.total}</div>
          <div className="text-muted text-xs">Total Admins</div>
        </div>
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card">
          <RiShieldStarLine className="text-info text-xl mb-1" />
          <div className="text-white text-2xl font-black">{stats.superAdmins}</div>
          <div className="text-muted text-xs">Super Admins</div>
        </div>
        <div className="bg-bg-card border border-border rounded-card p-4 shadow-card">
          <RiUserStarLine className="text-warning text-xl mb-1" />
          <div className="text-white text-2xl font-black">{stats.standard}</div>
          <div className="text-muted text-xs">Standard Admins</div>
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-card p-4 mb-6 shadow-card">
        <p className="text-muted text-sm">
          Super admins can create admins, reset their passwords, change their name, email or phone, and remove access.
          Only the super admin sees this page. You cannot edit or delete your own account here
          (use Settings to change your own details).
        </p>
      </div>

      <DataTable columns={columns} data={admins} loading={loading} emptyMessage="No admins created yet" />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Admin">
        <div className="space-y-4">
          {formError && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{formError}</div>}
          <div>
            <label className={labelClass}>Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@fundilink.ug" type="email" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="7XX XXX XXX" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Temporary password</label>
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" type="password" className={inputClass} />
          </div>
          <button onClick={handleCreate} disabled={submitting} className="w-full bg-primary text-primary-text rounded-input px-4 py-3 text-sm font-bold hover:bg-amber-400 transition-colors disabled:opacity-50">
            {submitting ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Admin">
        {editTarget && (
          <div className="space-y-4">
            {formError && <div className="bg-red-500/10 border border-danger text-danger text-sm rounded-input px-4 py-3">{formError}</div>}
            <div className="bg-bg-raised rounded-input p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
                {getInitials(editTarget.name || editTarget.email)}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{editTarget.name}</div>
                <Badge label={editTarget.role === 'super_admin' ? 'Super Admin' : 'Admin'} type={editTarget.role === 'super_admin' ? 'info' : 'default'} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Full name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reset password <span className="normal-case font-normal text-muted">(leave blank to keep current)</span></label>
              <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="New password" type="password" className={inputClass} />
            </div>
            <div className="flex items-center gap-1.5 text-muted text-xs">
              <RiLockPasswordLine /> The admin must log in with the new password after a reset.
            </div>
            <button onClick={handleUpdate} disabled={submitting} className="w-full bg-primary text-primary-text rounded-input px-4 py-3 text-sm font-bold hover:bg-amber-400 transition-colors disabled:opacity-50">
              {submitting ? 'Updating…' : 'Save Changes'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminsPage;