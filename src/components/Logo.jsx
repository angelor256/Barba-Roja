export default function Logo({ size = 40, className = '' }) {
  return <img src={`${import.meta.env.BASE_URL}icons/logo.png`} width={size} height={size} alt="Barba Roja" className={`rounded-full ${className}`} />;
}
