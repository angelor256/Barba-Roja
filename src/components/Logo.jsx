export default function Logo({ size = 40, className = '' }) {
  return <img src="/icons/logo.png" width={size} height={size} alt="Barba Roja" className={`rounded-full ${className}`} />;
}
