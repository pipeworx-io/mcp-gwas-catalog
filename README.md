# mcp-gwas-catalog

GWAS Catalog (EBI/NHGRI) MCP — curated catalog of genome-wide association studies.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_snp` | GWAS Catalog: look up a single-nucleotide polymorphism (SNP) by rsID. Returns functional class, chromosome/region locations, and mapped genes (with up/downstream + distance). Keyless, from EBI/NHGRI. |
| `snp_associations` | GWAS Catalog: get trait/disease associations for a SNP (rsID) — risk allele, p-value, odds ratio per copy, beta/effect size, and risk allele frequency. Keyless, from EBI/NHGRI. |
| `studies_by_trait` | GWAS Catalog: find genome-wide association studies for a disease/trait (EFO trait, e.g. "asthma" or "type 2 diabetes"). Returns accession, PubMed ID, title, journal, date, sample size. Keyless, from EBI/NHGRI. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "gwas-catalog": {
      "url": "https://gateway.pipeworx.io/gwas-catalog/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Gwas Catalog data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
