// Build-time only (docs/03 ADR-013): rendered by Astro without a client directive, so no React ships.
// A .tsx component (rather than nested <Table> calls in .astro) keeps the table children as real React
// nodes — Astro would otherwise wrap each slot in <astro-static-slot>, which is invalid inside <table>.
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ISupportMatrixRow {
  id: string;
  name: string;
  minimumVersion: string | null;
  mechanism: string;
  platforms: string;
  notes: string;
}

export interface ISupportMatrixProps {
  caption: string;
  headers: { name: string; version: string; mechanism: string; platforms: string; notes: string };
  anyLabel: string;
  rows: ISupportMatrixRow[];
}

export function SupportMatrix({ caption, headers, anyLabel, rows }: ISupportMatrixProps) {
  return (
    <Table className="min-w-[32rem] caption-top">
      <TableCaption className="mb-2 mt-0 text-start">{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{headers.name}</TableHead>
          <TableHead scope="col">{headers.version}</TableHead>
          <TableHead scope="col">{headers.mechanism}</TableHead>
          <TableHead scope="col">{headers.platforms}</TableHead>
          <TableHead scope="col">{headers.notes}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableHead scope="row" className="h-auto py-2 align-top whitespace-normal">
              {row.name}
            </TableHead>
            <TableCell className="align-top">{row.minimumVersion ?? anyLabel}</TableCell>
            <TableCell className="align-top">{row.mechanism}</TableCell>
            <TableCell className="align-top whitespace-normal">{row.platforms || anyLabel}</TableCell>
            <TableCell className="align-top whitespace-normal">{row.notes}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
