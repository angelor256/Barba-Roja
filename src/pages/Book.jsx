import { useSearchParams } from 'react-router-dom';
import BookingFlow from '../components/BookingFlow';

export default function Book() {
  const [p] = useSearchParams();
  const initial = { services: p.get('s') ? p.get('s').split(',') : [], barber: p.get('b') || null };
  return <BookingFlow key={p.toString()} initial={initial} />;
}
