import type { TxType } from '@/data/types';
import { MASK, rupiah, rupiahSigned } from '@/lib/format';
import { Txt, type TxtProps } from './Txt';

interface MoneyProps extends Omit<TxtProps, 'children'> {
  amount: number;
  /** Bila diisi, nominal tampil bertanda: "+Rp…" atau "−Rp…". */
  type?: TxType;
  masked?: boolean;
  /** Pemasukan diberi warna hijau (default aktif bila `type` diisi). */
  colorize?: boolean;
}

export function Money({ amount, type, masked, colorize = true, tone, ...rest }: MoneyProps) {
  const text = masked ? MASK : type ? rupiahSigned(amount, type) : rupiah(amount);
  const resolved = tone ?? (colorize && type === 'income' && !masked ? 'positive' : 'ink');
  return (
    <Txt tone={resolved} accessibilityLabel={masked ? 'Nominal disembunyikan' : undefined} {...rest}>
      {text}
    </Txt>
  );
}
