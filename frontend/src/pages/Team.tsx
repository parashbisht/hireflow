import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { UserPlus, UsersRound } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useToast } from '../components/Toast';
import { createOrganizationUser, getOrganizationUsers } from '../services/authService';
import type { OrganizationUser, UserRole } from '../types/auth';

const ROLES: UserRole[] = ['ADMIN', 'RECRUITER', 'VIEWER'];
const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200',
  RECRUITER: 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200',
  VIEWER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response;
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data;
      if (typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
  }
  return fallback;
};

const Team = () => {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('RECRUITER');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    getOrganizationUsers()
      .then(setUsers)
      .catch(() => setLoadError('Could not load team members. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const user = await createOrganizationUser({ name, email, password, role });
      setUsers((current) => [...current, user].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setEmail('');
      setPassword('');
      setRole('RECRUITER');
      showToast('success', `${user.name} was added to your team.`);
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Could not add this team member. Please try again.');
      setFormError(message);
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-7">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Workspace</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Review organization members and add new users with the right role.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Organization members</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {users.length} {users.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            <UsersRound size={20} className="text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
          </div>

          {isLoading ? (
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">Loading team members...</p>
          ) : loadError ? (
            <p role="alert" className="p-5 text-sm text-rose-700 dark:text-rose-300">{loadError}</p>
          ) : users.length === 0 ? (
            <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No team members found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Member</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Role</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${ROLE_STYLES[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                        <time dateTime={user.createdAt}>{new Date(user.createdAt).toLocaleDateString()}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <UserPlus size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Add a team member</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Create organization access</p>
            </div>
          </div>

          {formError && (
            <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="team-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
              <input id="team-name" className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="team-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
              <input id="team-email" type="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="team-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Initial password</label>
              <input id="team-password" type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" />
            </div>
            <div>
              <label htmlFor="team-role" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Role</label>
              <select id="team-role" className={inputClass} value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Share the initial password with the new member through a secure channel.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? 'Adding member...' : 'Add member'}
            </button>
          </form>
        </section>
      </div>
    </MainLayout>
  );
};

export default Team;
