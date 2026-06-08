interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * GWAS Catalog (EBI/NHGRI) MCP — curated catalog of genome-wide association studies.
 * Look up a SNP (rsID) and its mapped genes, get trait associations + p-values/effect
 * sizes for a SNP, or find studies for a disease/trait. Keyless REST API.
 */


const BASE = 'https://www.ebi.ac.uk/gwas/rest/api';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_snp',
    description:
      'GWAS Catalog: look up a single-nucleotide polymorphism (SNP) by rsID. Returns functional class, chromosome/region locations, and mapped genes (with up/downstream + distance). Keyless, from EBI/NHGRI.',
    inputSchema: {
      type: 'object',
      properties: {
        rsid: { type: 'string', description: 'dbSNP rsID, e.g. "rs7329174".' },
      },
      required: ['rsid'],
    },
  },
  {
    name: 'snp_associations',
    description:
      'GWAS Catalog: get trait/disease associations for a SNP (rsID) — risk allele, p-value, odds ratio per copy, beta/effect size, and risk allele frequency. Keyless, from EBI/NHGRI.',
    inputSchema: {
      type: 'object',
      properties: {
        rsid: { type: 'string', description: 'dbSNP rsID, e.g. "rs7329174".' },
        limit: { type: 'number', description: 'Max associations to return (default 20).' },
      },
      required: ['rsid'],
    },
  },
  {
    name: 'studies_by_trait',
    description:
      'GWAS Catalog: find genome-wide association studies for a disease/trait (EFO trait, e.g. "asthma" or "type 2 diabetes"). Returns accession, PubMed ID, title, journal, date, sample size. Keyless, from EBI/NHGRI.',
    inputSchema: {
      type: 'object',
      properties: {
        trait: { type: 'string', description: 'Disease or trait name, e.g. "asthma", "type 2 diabetes".' },
        limit: { type: 'number', description: 'Max studies to return (default 10).' },
      },
      required: ['trait'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'get_snp':
        return await getSnp(args);
      case 'snp_associations':
        return await snpAssociations(args);
      case 'studies_by_trait':
        return await studiesByTrait(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function getSnp(args: Record<string, unknown>): Promise<unknown> {
  const rsid = reqStr(args, 'rsid');
  const res = await fetch(`${BASE}/singleNucleotidePolymorphisms/${encodeURIComponent(rsid)}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (res.status === 404) return { error: 'SNP not found', rsid };
  if (!res.ok) return { error: `GWAS Catalog: ${res.status} ${(await res.text()).slice(0, 200)}` };
  const data = (await res.json()) as any;
  return {
    rsid: data?.rsId,
    functional_class: data?.functionalClass,
    locations: (data?.locations || []).map((l: any) => ({
      chromosome: l?.chromosomeName,
      position: l?.chromosomePosition,
      region: l?.region?.name,
    })),
    genes: (data?.genomicContexts || []).map((g: any) => ({
      gene: g?.gene?.geneName,
      distance: g?.distance,
      upstream: g?.isUpstream,
      downstream: g?.isDownstream,
    })),
  };
}

async function snpAssociations(args: Record<string, unknown>): Promise<unknown> {
  const rsid = reqStr(args, 'rsid');
  const limit = numOr(args.limit, 20);
  const res = await fetch(`${BASE}/singleNucleotidePolymorphisms/${encodeURIComponent(rsid)}/associations`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (res.status === 404) return { error: 'SNP not found', rsid };
  if (!res.ok) return { error: `GWAS Catalog: ${res.status} ${(await res.text()).slice(0, 200)}` };
  const data = (await res.json()) as any;
  const list: any[] = data?._embedded?.associations || [];
  const associations = list.slice(0, limit).map((a: any) => {
    let riskAllele: string | undefined;
    for (const locus of a?.loci || []) {
      const allele = (locus?.strongestRiskAlleles || [])[0]?.riskAlleleName;
      if (allele) {
        riskAllele = allele;
        break;
      }
    }
    return {
      risk_allele: riskAllele,
      pvalue: a?.pvalue,
      or_per_copy: a?.orPerCopyNum,
      beta: a?.betaNum,
      beta_unit: a?.betaUnit,
      risk_frequency: a?.riskFrequency,
    };
  });
  return { rsid, count: associations.length, associations };
}

async function studiesByTrait(args: Record<string, unknown>): Promise<unknown> {
  const trait = reqStr(args, 'trait');
  const limit = numOr(args.limit, 10);
  const url = `${BASE}/studies/search/findByEfoTrait?efoTrait=${encodeURIComponent(trait)}&size=${encodeURIComponent(
    String(limit),
  )}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) return { error: `GWAS Catalog: ${res.status} ${(await res.text()).slice(0, 200)}` };
  const data = (await res.json()) as any;
  const list: any[] = data?._embedded?.studies || [];
  const studies = list.map((s: any) => ({
    accession: s?.accessionId,
    trait: s?.diseaseTrait?.trait,
    pubmed_id: s?.publicationInfo?.pubmedId,
    title: s?.publicationInfo?.title,
    journal: s?.publicationInfo?.publication,
    date: s?.publicationInfo?.publicationDate,
    sample_size: s?.initialSampleSize,
  }));
  return { trait, count: studies.length, total: data?.page?.totalElements, studies };
}

function reqStr(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing.`);
  return v;
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
