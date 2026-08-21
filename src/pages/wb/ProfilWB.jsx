import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { updateOwnContact } from '../../services/wbServices';

const ProfilWB = () => {
    const { currentUser } = useAuth();
    const [noHp, setNoHp] = useState(currentUser?.noHp || '');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [resetSent, setResetSent] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await updateOwnContact(currentUser.uid, noHp, currentUser);
            setMessage('Nomor HP berhasil diperbarui.');
        } catch (err) {
            setMessage('Gagal memperbarui: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, currentUser.email);
        } catch {
            // pesan generik dijaga sama walau gagal, jangan bocorin status akun
        } finally {
            setResetSent(true);
        }
    };

    return (
        <div className="space-y-6 max-w-xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-gray-500 mt-1">Data diri Anda di PKBM KARTINI.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-400">Nama Lengkap</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{currentUser?.nama}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{currentUser?.email}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Program Paket</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{currentUser?.paket || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">NIK</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{currentUser?.nik || '-'}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="pt-4 border-t space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor HP</label>
                        <input
                            type="tel"
                            value={noHp}
                            onChange={(e) => setNoHp(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        {message && <p className="text-xs text-gray-500">{message}</p>}
                        <button
                            type="submit"
                            disabled={saving}
                            className="ml-auto px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                        >
                            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center justify-between gap-4">
                <div>
                    <p className="font-semibold text-gray-800">Ganti Password</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {resetSent ? 'Tautan reset password sudah dikirim ke email Anda.' : 'Kami akan kirim tautan reset password ke email Anda.'}
                    </p>
                </div>
                <button
                    onClick={handleResetPassword}
                    disabled={resetSent}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 shrink-0"
                >
                    {resetSent ? 'Terkirim' : 'Kirim Email Reset'}
                </button>
            </div>
        </div>
    );
};

export default ProfilWB;
