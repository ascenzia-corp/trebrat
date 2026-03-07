import React, { useState } from 'react';
import { Users, UserPlus, Shield, Brush, Wrench } from 'lucide-react';
import NavBar from '../components/layout/NavBar';
import PageContainer from '../components/layout/PageContainer';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useTeam } from '../hooks/useTeam';
import type { UserRole } from '../types';

const roleConfig: Record<UserRole, { label: string; variant: 'primary' | 'success' | 'warning'; icon: React.ReactNode }> = {
  owner: { label: 'Propriétaire', variant: 'primary', icon: <Shield size={16} /> },
  cleaning: { label: 'Ménage', variant: 'success', icon: <Brush size={16} /> },
  maintenance: { label: 'Maintenance', variant: 'warning', icon: <Wrench size={16} /> },
};

export default function TeamPage() {
  const { members, loading, invite, updateRole } = useTeam();
  const [showInvite, setShowInvite] = useState(false);
  const [editMember, setEditMember] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'cleaning' as UserRole });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviting(true);
    try {
      await invite(form.email, form.role, form.fullName);
      setShowInvite(false);
      setForm({ email: '', fullName: '', role: 'cleaning' });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateRole(userId, newRole);
    setEditMember(null);
  };

  return (
    <div className="flex flex-col h-full">
      <NavBar
        title="Équipe"
        rightAction={
          <button
            onClick={() => setShowInvite(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-ios-primary"
            aria-label="Inviter un membre"
          >
            <UserPlus size={22} />
          </button>
        }
      />

      <PageContainer>
        {loading ? (
          <div className="py-20"><Spinner /></div>
        ) : (
          <div className="px-4 space-y-2 pb-4">
            {members.map((member) => {
              const config = roleConfig[member.role];
              return (
                <Card key={member.id} onClick={() => setEditMember(member.id)} className="fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-ios-bg flex items-center justify-center text-ios-text-secondary text-[17px] font-semibold flex-shrink-0">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.full_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-medium truncate">{member.full_name}</h3>
                      {member.phone && <p className="text-[13px] text-ios-text-secondary">{member.phone}</p>}
                    </div>
                    <Badge variant={config.variant}>
                      <span className="flex items-center gap-1">{config.icon} {config.label}</span>
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Inviter un membre">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input label="Nom complet" value={form.fullName} onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
          <div>
            <label className="block text-[13px] text-ios-text-secondary font-medium uppercase tracking-wide mb-1">Rôle</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full h-[44px] px-4 rounded-[10px] bg-ios-bg text-[17px]"
            >
              <option value="cleaning">Ménage</option>
              <option value="maintenance">Maintenance</option>
              <option value="owner">Propriétaire</option>
            </select>
          </div>
          {error && <p className="text-[13px] text-ios-danger">{error}</p>}
          <Button type="submit" fullWidth disabled={inviting}>
            {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
          </Button>
        </form>
      </Modal>

      {/* Edit role modal */}
      <Modal open={!!editMember} onClose={() => setEditMember(null)} title="Modifier le rôle">
        <div className="space-y-3">
          {(['owner', 'cleaning', 'maintenance'] as UserRole[]).map((role) => {
            const config = roleConfig[role];
            const member = members.find(m => m.id === editMember);
            const isActive = member?.role === role;
            return (
              <button
                key={role}
                onClick={() => editMember && handleRoleChange(editMember, role)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl min-h-[44px] transition-colors ${
                  isActive ? 'bg-ios-primary/10 border-2 border-ios-primary' : 'bg-ios-bg'
                }`}
              >
                {config.icon}
                <span className="text-[17px] font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
