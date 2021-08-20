const chalk = require('chalk')
const notifier = require('node-notifier')
const https = require('https')

let trigger_webhook = (text, webhook_url, retry_if_error) => {
    const data = JSON.stringify({
        username: 'SHS Notifier',
        content: `@everyone ! ${text}`, embeds: []
    })

    let r = https.request(webhook_url, {
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
        },
        method: 'POST'
    }, response => {
        if (![200, 201, 204].includes(response.statusCode)) {
            console.error(`Got ${response.statusCode} instead of 2xx while triggering Discord\'s webhook`)
            
            if (retry_if_error)
                setTimeout(() => trigger_webhook(text, webhook_url), 5000)
        }
    })

    r.on('error', e => {
        console.error(`Error while triggering Discord webhook: ${e}`)
    })
    
    r.write(data)
    r.end()
}

module.exports = (availableCourses, { do_discord_webhook, discord_webhook_url, discord_webhook_spam, desktop_notification }) => {
    if (availableCourses instanceof Array)
        availableCourses = availableCourses.join(', ')
    
    const text = `Course available!!! ${availableCourses}`

    console.log(`\n${chalk.red('!')} ${chalk.yellow(text)}\n`)

    if (do_discord_webhook) {
        trigger_webhook(text, discord_webhook_url, !discord_webhook_spam)

        if (discord_webhook_spam) {
            console.log(`\n${chalk.red('!')} Starting to spam the webhook. Will stop in 60 seconds.`)
            let interval = setInterval(() => trigger_webhook(text, discord_webhook_url, false), 2000)

            setTimeout(() => clearInterval(interval), 60000)
        }
    }

    if (desktop_notification) {
        notifier.notify({
            title: 'SHS Notifier',
            message: text
        });
    }

}