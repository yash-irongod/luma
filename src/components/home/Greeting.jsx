import { getGreeting } from '../../utils/dates';
import { useUIStore } from '../../stores/uiStore';
import { format } from 'date-fns';

export default function Greeting() {
  const userName = useUIStore(s => s.userName);
  const greeting = getGreeting();
  const dateStr = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="greeting">
      <h1 className="greeting-text">
        {greeting}{userName ? `, ${userName}` : ''}.
      </h1>
      <p className="greeting-date">{dateStr}</p>
    </div>
  );
}
