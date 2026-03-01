import fs from 'fs';
import path from 'path';

const CONTENT_DIR = '/Users/seuncho/coding/blog-oiyo/src/content';

function processFrontmatter(content: string): string {
    if (content.startsWith('---')) {
        const endIdx = content.indexOf('---', 3);
        if (endIdx !== -1) {
            let frontmatter = content.substring(3, endIdx);
            const body = content.substring(endIdx + 3);

            // Change date: to pubDate:
            frontmatter = frontmatter.replace(/^date:/m, 'pubDate:');

            return `---${frontmatter}---${body}`;
        }
    }
    return content;
}

function processArticles() {
    const articlesDir = path.join(CONTENT_DIR, 'articles');
    if (!fs.existsSync(articlesDir)) return;

    const categories = fs.readdirSync(articlesDir).filter(f => fs.statSync(path.join(articlesDir, f)).isDirectory());

    for (const category of categories) {
        const categoryPath = path.join(articlesDir, category);
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

        for (const file of files) {
            // Expecting slug.locale.mdx
            const match = file.match(/^(.*)\.([a-z]{2})\.mdx?$/);
            if (match) {
                const [, slug, locale] = match;
                const ext = file.endsWith('.mdx') ? '.mdx' : '.md';

                const targetDir = path.join(articlesDir, locale, category);
                fs.mkdirSync(targetDir, { recursive: true });

                const oldPath = path.join(categoryPath, file);
                const newPath = path.join(targetDir, `${slug}${ext}`);

                const content = fs.readFileSync(oldPath, 'utf8');
                const updatedContent = processFrontmatter(content);

                fs.writeFileSync(newPath, updatedContent);
                fs.unlinkSync(oldPath);
            }
        }

        // Check if category dir is empty and remove it if so
        if (fs.readdirSync(categoryPath).length === 0) {
            fs.rmdirSync(categoryPath);
        }
    }
}

function processEducation() {
    const educationDir = path.join(CONTENT_DIR, 'education');
    if (!fs.existsSync(educationDir)) return;

    const categories = fs.readdirSync(educationDir).filter(f => fs.statSync(path.join(educationDir, f)).isDirectory());

    for (const category of categories) {
        const categoryPath = path.join(educationDir, category);
        const locales = fs.readdirSync(categoryPath).filter(f => fs.statSync(path.join(categoryPath, f)).isDirectory());

        for (const locale of locales) {
            const localePath = path.join(categoryPath, locale);
            const files = fs.readdirSync(localePath).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

            const targetDir = path.join(educationDir, locale, category);
            fs.mkdirSync(targetDir, { recursive: true });

            for (const file of files) {
                const oldPath = path.join(localePath, file);
                const newPath = path.join(targetDir, file);

                const content = fs.readFileSync(oldPath, 'utf8');
                const updatedContent = processFrontmatter(content);

                fs.writeFileSync(newPath, updatedContent);
                fs.unlinkSync(oldPath);
            }

            fs.rmdirSync(localePath);
        }

        if (fs.readdirSync(categoryPath).length === 0) {
            fs.rmdirSync(categoryPath);
        }
    }
}

console.log("Starting migration...");
processArticles();
processEducation();
console.log("Migration finished.");
