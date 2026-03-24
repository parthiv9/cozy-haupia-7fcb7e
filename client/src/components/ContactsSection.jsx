import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const PREF_KEY = 'skycast_user_contacts_v1';

function permissionMessage() {
  return 'Permission required to use this feature';
}

function saveContactPref(contact) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...contact, savedAt: Date.now() }));
  } catch {
    /* ignore */
  }
}

export default function ContactsSection() {
  const [error, setError] = useState('');
  const [picked, setPicked] = useState(null);

  const contactsApiAvailable = useMemo(() => {
    return typeof navigator !== 'undefined' && typeof navigator.contacts?.select === 'function';
  }, []);

  const pickContact = async () => {
    setError('');
    setPicked(null);

    if (!contactsApiAvailable) {
      setError(permissionMessage());
      return;
    }

    try {
      // Prefer phone number selection. We still request `name` so we can label the chosen number.
      const res = await navigator.contacts.select(['name', 'tel']);
      const first = Array.isArray(res) ? res[0] : res;

      const name = first?.name ? String(first.name) : 'Contact';
      const telRaw = first?.tel ? (Array.isArray(first.tel) ? first.tel[0] : first.tel) : '';
      const tel =
        typeof telRaw === 'string'
          ? telRaw
          : telRaw?.value
            ? String(telRaw.value)
            : telRaw?.valueNumber
              ? String(telRaw.valueNumber)
              : '';

      const normalized = {
        name,
        tel: tel ? String(tel) : '',
      };

      setPicked(normalized);
      saveContactPref(normalized);
    } catch {
      setError(permissionMessage());
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mb-4 rounded-3xl border border-white/30 bg-white/40 p-4 shadow-glass backdrop-blur-2xl"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>
          👤
        </span>
        <h3 className="text-sm font-semibold text-text-dark">Contacts</h3>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={pickContact}
          className="rounded-2xl bg-primary-end px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Pick Contact
        </button>

        {error ? (
          <p className="rounded-xl border border-red-200/90 bg-red-50/95 px-3 py-2 text-xs font-medium text-red-900/90">
            {error}
          </p>
        ) : null}

        {picked ? (
          <div className="rounded-2xl border border-white/20 bg-white/70 p-3">
            <p className="text-sm font-semibold text-text-dark">{picked.name}</p>
            {picked.tel ? <p className="mt-1 text-xs text-text-dark/60">{picked.tel}</p> : null}
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

