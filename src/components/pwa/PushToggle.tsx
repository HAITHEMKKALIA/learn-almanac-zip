import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  enablePushNotifications,
  disablePushNotifications,
  getPushStatus,
  isPushSupported,
} from '@/lib/pushNotifications';

export default function PushToggle() {
  const [status, setStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [busy, setBusy] = useState(false);

  useEffect(() => { getPushStatus().then(setStatus); }, []);

  if (!isPushSupported() || status === 'unsupported') {
    return (
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        Ce navigateur ne prend pas en charge les notifications push. Installez l'app (Ajouter à l'écran d'accueil) sur iOS/Android.
      </div>
    );
  }

  const enable = async () => {
    setBusy(true);
    const r = await enablePushNotifications();
    setBusy(false);
    if (r.ok) {
      setStatus('granted');
      toast({ title: 'Notifications activées', description: 'Vous recevrez les alertes même app fermée.' });
    } else {
      toast({
        title: 'Activation impossible',
        description: r.reason === 'denied' ? 'Autorisation refusée par le navigateur.' : r.reason ?? 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  const disable = async () => {
    setBusy(true);
    await disablePushNotifications();
    setBusy(false);
    setStatus('default');
    toast({ title: 'Notifications désactivées' });
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex items-center gap-2 text-sm">
        {status === 'granted' ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
        <span>
          {status === 'granted'
            ? 'Notifications push activées (image + son, même app fermée).'
            : 'Activez les notifications push pour recevoir les alertes hors app.'}
        </span>
      </div>
      {status === 'granted' ? (
        <Button size="sm" variant="outline" onClick={disable} disabled={busy}>Désactiver</Button>
      ) : (
        <Button size="sm" onClick={enable} disabled={busy}>Activer</Button>
      )}
    </div>
  );
}
