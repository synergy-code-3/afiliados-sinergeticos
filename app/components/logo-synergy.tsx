/** Logo "Synergy +1": wordmark en blanco (Outfit, bold) + píldora
 * neumórfica verde con el "+1" en negro. Vive como HTML para heredar la
 * tipografía del sitio y escalar nítido; la versión standalone está en
 * `/public/brand/logo-synergy-plus.svg`. */
interface LogoSynergyPlusProps {
  /** Tamaño del wordmark en px (la píldora escala en proporción). */
  size?: number;
}

export default function LogoSynergyPlus({ size = 26 }: LogoSynergyPlusProps) {
  return (
    <span className="logo-synergy" style={{ fontSize: size }}>
      Synergy
      <span className="logo-mas-uno">+1</span>
    </span>
  );
}
