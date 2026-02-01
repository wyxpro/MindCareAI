const { Client } = require('pg');
const client = new Client({
    connectionString: 'postgresql://postgres:123056@localhost:5432/mindcareai'
});

async function check() {
    try {
        await client.connect();
        const posts = await client.query('SELECT count(*) FROM community_posts');
        const categories = await client.query('SELECT id, name FROM post_categories');
        console.log('Post Count:', posts.rows[0].count);
        console.log('Categories:', categories.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

check();
