const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

// Adjusted paths to climb out of the /scripts/ folder into your root directory
const POSTS_DIR = path.join(__dirname, '..', 'blog_posts');
const MANIFEST_PATH = path.join(__dirname, '..', 'manifest.json');

const IMAP_HOST = process.env.IMAP_HOST;
const IMAP_USER = process.env.IMAP_USER;
const IMAP_PASS = process.env.IMAP_PASS;
const BLOG_SECRET = process.env.BLOG_SECRET;

if (!fs.existsSync(POSTS_DIR)){
    fs.mkdirSync(POSTS_DIR);
}

async function main() {
    console.log("Starting email sync sequence...");
    const client = new ImapFlow({
        host: IMAP_HOST,
        port: 993,
        secure: true,
        auth: { user: IMAP_USER, pass: IMAP_PASS },
        logger: false
    });

    await client.connect();
    let lock = await client.getMailboxLock('INBOX');

    try {
        // Calculate the date boundary for 2 days ago
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        console.log(`Filtering for unread emails since: ${twoDaysAgo.toDateString()}`);

        // Narrow the query window on the IMAP server side
        let messages = await client.search({ 
            seen: false,
            since: twoDaysAgo 
        });
        
        if (messages.length === 0) {
            console.log("No new unread blog emails discovered in the last 2 days.");
            return;
        }

        console.log(`Discovered ${messages.length} recent unread email(s). Processing...`);

        let manifest = [];
        if (fs.existsSync(MANIFEST_PATH)) {
            manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        }

        let updated = false;

        for (let uid of messages) {
            let message = await client.fetchOne(uid, { source: true, internalDate: true });
            let parsed = await simpleParser(message.source);
            let emailText = parsed.text || "";
            
            // Flexibly checks for "pass=" or "password=" ignoring spaces and carriage returns (\r)
            const authRegex = new RegExp(`(?:password|pass)\\s*=\\s*${escapeRegExp(BLOG_SECRET)}`, 'i');
            
            if (!authRegex.test(emailText)) {
                console.log(`Email UID ${uid} failed security validation. Skipping.`);
                continue; 
            }

            // Clean out the secret key line
            const cleanedText = emailText.replace(authRegex, '').trim();
            const post = parseEmailContent(parsed.subject, cleanedText, message.internalDate);

            if (post) {
                const timestamp = Math.floor(new Date(message.internalDate).getTime() / 1000);
                const filename = `${timestamp}.json`;
                const filePath = path.join(POSTS_DIR, filename);

                fs.writeFileSync(filePath, JSON.stringify(post, null, 2), 'utf8');
                console.log(`Saved individual post entry: blog_posts/${filename}`);

                if (!manifest.includes(filename)) {
                    manifest.push(filename);
                }
                
                updated = true;
                await client.messageFlagsAdd({ uid }, ['\\Seen']);
            }
        }

        if (updated) {
            manifest.sort((a, b) => parseInt(b) - parseInt(a));
            fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
            console.log("manifest.json root file updated successfully.");
        }

    } finally {
        lock.release();
        await client.logout();
        console.log("Sync script finished processing.");
    }
}

function parseEmailContent(subject, text, internalDate) {
    try {
        const parts = text.split('---');
        const metadataRaw = parts[0] || "";
        const content = parts.slice(1).join('---').trim();

        const metadata = {};
        metadataRaw.split('\n').forEach(line => {
            const match = line.match(/^([^:]+):\s*(.*)$/);
            if (match) {
                metadata[match[1].trim().toLowerCase()] = match[2].trim();
            }
        });

        return {
            title: subject || "Untitled Post",
            date: metadata.date || new Date(internalDate).toISOString().split('T')[0],
            description: metadata.description || "",
            tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [],
            content: content || metadataRaw.trim()
        };
    } catch (err) {
        console.error("Critical error parsing email content structure:", err);
        return null;
    }
}

function escapeRegExp(string) {
    if (!string) return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main().catch(err => {
    console.error("Execution layer crash:", err);
    process.exit(1);
});