#!/usr/bin/env node
/**
 * Generates the field reference FROM the schemas. Nothing here is written by hand.
 *
 *   npm run build-reference            → writes the generated files
 *   npm run build-reference -- --check → fails if they are stale or a translation is missing (CI)
 *
 * What is generated: everything factual about a field (name, type, required, allowed values,
 * examples). What is NOT: the rules a validator cannot check — why `id` must never change, why
 * a cancelled event stays published. Those live, hand-written, in spec/<version>/README.md.
 *
 * Outputs:
 *   spec/<version>/reference.<lang>.md   → for people reading the repo
 *   docs/data/reference.json             → for the website, which renders it in both languages
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fieldsOf, loadSchemas } from "./schema-model.mjs";

const VERSION = "v0.1";
const BASE_LANG = "en"; // the schema's own `description` fields
const check = process.argv.includes("--check");

const { event, feed, registry } = loadSchemas(VERSION);
const i18nDir = join("spec", VERSION, "i18n");
const locales = { [BASE_LANG]: null };
if (existsSync(i18nDir)) {
  for (const file of readdirSync(i18nDir).filter((f) => f.endsWith(".json"))) {
    locales[file.replace(".json", "")] = JSON.parse(readFileSync(join(i18nDir, file), "utf8"));
  }
}

/** The model both renderers consume. One source, many outputs. */
const model = {
  specVersion: "0.1.0",
  languages: Object.keys(locales),
  schemas: [
    { name: "event", schema: event },
    { name: "feed", schema: feed },
  ].map(({ name, schema }) => ({
    name,
    title: { [BASE_LANG]: schema.title },
    description: { [BASE_LANG]: schema.description },
    fields: [...fieldsOf(schema, registry)].map(([path, , meta]) => ({
      path,
      type: meta.type,
      required: meta.required,
      examples: meta.examples,
      description: { [BASE_LANG]: meta.description },
    })),
  })),
};

// Merge translations, and refuse to ship a half-translated reference.
const missing = [];
for (const [lang, dict] of Object.entries(locales)) {
  if (!dict) continue;
  for (const schema of model.schemas) {
    schema.title[lang] = dict.schemas?.[schema.name]?.title;
    schema.description[lang] = dict.schemas?.[schema.name]?.description;
    if (!schema.title[lang]) missing.push(`${lang}: schemas.${schema.name}.title`);
    for (const field of schema.fields) {
      const key = `${schema.name}.${field.path}`;
      const text = dict.fields?.[key];
      if (!text) missing.push(`${lang}: fields["${key}"]`);
      field.description[lang] = text ?? field.description[BASE_LANG];
    }
  }
}

const md = (lang) => {
  const t = {
    en: {
      intro: `Generated from the schemas — do not edit by hand. Run \`npm run build-reference\`.`,
      rules: `The rules a validator cannot check (why \`id\` must never change, why a cancelled event stays published) are in [README.md](README.md).`,
      field: "Field",
      type: "Type",
      req: "Required",
      desc: "Description",
      ex: "Examples",
      yes: "yes",
      no: "—",
    },
    es: {
      intro: `Generado a partir de los schemas — no lo edites a mano. Ejecuta \`npm run build-reference\`.`,
      rules: `Las reglas que un validador no puede comprobar (por qué el \`id\` no cambia nunca, por qué un evento cancelado sigue publicado) están en [README.md](README.md).`,
      field: "Campo",
      type: "Tipo",
      req: "Oblig.",
      desc: "Descripción",
      ex: "Ejemplos",
      yes: "sí",
      no: "—",
    },
  }[lang];

  const lines = [
    `# ${lang === "es" ? "Referencia de campos" : "Field reference"} — OTE Spec ${model.specVersion}`,
    "",
    `> 🤖 ${t.intro}`,
    ">",
    `> ${t.rules}`,
    "",
  ];

  for (const schema of model.schemas) {
    lines.push(`## \`${schema.name}\` — ${schema.title[lang]}`, "", schema.description[lang], "");
    lines.push(`| ${t.field} | ${t.type} | ${t.req} | ${t.desc} | ${t.ex} |`, "| --- | --- | :---: | --- | --- |");
    for (const f of schema.fields) {
      const ex = f.examples.map((e) => `\`${JSON.stringify(e)}\``).join("<br>") || "—";
      lines.push(
        `| \`${f.path}\` | ${f.type} | ${f.required ? `**${t.yes}**` : t.no} | ${f.description[lang]} | ${ex} |`
      );
    }
    lines.push("");
  }
  return lines.join("\n");
};

const outputs = [
  ...Object.keys(locales).map((lang) => [join("spec", VERSION, `reference.${lang}.md`), md(lang)]),
  [join("docs", "data", "reference.json"), JSON.stringify(model, null, 2) + "\n"],
];

if (check) {
  const stale = outputs.filter(([path, content]) => !existsSync(path) || readFileSync(path, "utf8") !== content);
  for (const [path] of stale) console.log(`  FAIL  ${path} is stale — run: npm run build-reference`);
  for (const key of missing) console.log(`  FAIL  missing translation → ${key}`);
  if (stale.length || missing.length) process.exit(1);
  console.log(`  ok    reference is generated from the schemas and fully translated (${model.languages.join(", ")})`);
} else {
  for (const [path, content] of outputs) {
    writeFileSync(path, content);
    console.log(`  wrote ${path}`);
  }
  if (missing.length) {
    console.log(`\n${missing.length} missing translation(s):`);
    for (const key of missing) console.log(`  - ${key}`);
    process.exit(1);
  }
}
