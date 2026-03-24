import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

function permissionMessage() {
  return 'Permission required to use this feature';
}

export default function ContactsSection({ isNight = false }) {
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [permHint, setPermHint] = useState(null);

  const contactsApiAvailable = useMemo(() => {
    return typeof navigator !== 'undefined' && typeof navigator.contacts?.select === 'function';
  }, []);

  useEffect(() => {
    if (!contactsApiAvailable) return;
    let cancelled = false;
    (async () => {
      try {
        const q = navigator.permissions?.query?.({ name: 'contacts' });
        const status = q && typeof q.then === 'function' ? await q : null;
        if (cancelled || !status) return;
        if (status.state === 'denied') {
          setPermHint(permissionMessage());
        }
      } catch {
        /* 'contacts' not supported in Permissions API — rely on picker prompt */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactsApiAvailable]);

  const pickContact = async () => {
    setError('');
    setInfo('');

    if (!contactsApiAvailable) return;

    try {
      const res = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      const list = Array.isArray(res) ? res : [];
      if (!list.length) {
        setInfo('No contact was selected.');
        return;
      }

      setPermHint(null);
      setInfo('Contact selected.');
    } catch (err) {
      const code = err?.name || '';
      if (code === 'AbortError' || code === 'NotFoundError') {
        setInfo('Selection cancelled.');
        return;
      }
      if (code === 'InvalidStateError' || code === 'SecurityError' || code === 'NotAllowedError') {
        setPermHint(null);
        setError(permissionMessage());
        return;
      }
      setPermHint(null);
      setError(permissionMessage());
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`mb-4 rounded-3xl border p-4 shadow-lg backdrop-blur-2xl ${
        isNight ? 'border-white/15 bg-white/[0.06]' : 'border-white/30 bg-white/40'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          👤
        </span>
        <h3 className={`text-sm font-semibold ${isNight ? 'text-slate-100' : 'text-slate-900'}`}>Contacts</h3>
      </div>

      <p
        className={`mt-2 text-sm leading-relaxed ${isNight ? 'text-gray-300' : 'text-slate-600'}`}
      >
        Access your contacts to quickly share weather updates or reach out to important people during emergencies.
        This feature can also help you contact nearby support services, such as NDRF teams, when needed.
      </p>

      <p className={`mt-1 text-xs leading-relaxed ${isNight ? 'text-slate-400' : 'text-slate-600'}`}>
        {contactsApiAvailable ? (
          <>
            Opens your device <strong className={isNight ? 'text-slate-300' : 'text-slate-700'}>saved contacts</strong> so
            you can pick a number. When the browser asks, allow access to contacts.
          </>
        ) : (
          <>
            Picking from your phone’s contact list needs the{' '}
            <strong className={isNight ? 'text-slate-300' : 'text-slate-700'}>Contact Picker API</strong> (typically{' '}
            <strong className={isNight ? 'text-slate-300' : 'text-slate-700'}>Chrome on Android</strong>, HTTPS). It is not
            available in this browser.
          </>
        )}
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={pickContact}
          disabled={!contactsApiAvailable}
          className="min-h-[44px] rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Choose from contacts
        </button>

        {permHint && contactsApiAvailable ? (
          <p className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-xs font-medium text-amber-950/90">
            {permHint}
          </p>
        ) : null}

        {info ? (
          <p className={`rounded-xl border px-3 py-2 text-xs font-medium ${isNight ? 'border-white/10 bg-white/[0.06] text-slate-300' : 'border-slate-200/80 bg-slate-50 text-slate-700'}`}>
            {info}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-900/90">
            {error}
          </p>
        ) : null}
      </div>
    </motion.section>
  );
}
