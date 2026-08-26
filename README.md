# mcp-gwas-catalog

GWAS Catalog (EBI/NHGRI) MCP — curated catalog of genome-wide association studies.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/gwas-catalog/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Gwas Catalog data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
