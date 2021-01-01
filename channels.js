module.exports = function (app) {
	if (typeof app.channel !== 'function') {
		// if no real-time functionality has been configured just return
		return
	}

	app.on('connection', (connection) => {
		app.channel('annonymous').join(connection)
	})

	app.on('login', (authResult, { connection }) => {
		if (connection) {
			const user = connection.user

			app.channel('annonymous').leave(connection)
			app.channel('authenticated').join(connection)

			// to send real-time events only to admins use
			if (user.isAdmin) {
				app.channel('admins').join(connection)
			}

			// if user has joined e.g. chat rooms
			if (Array.isArray(user.rooms)) {
				user.rooms.forEach((room) =>
					app.channel(`rooms/${room.id}`).join(connection)
				)
			}

			// easily organize users by email and userid for things like messaging
			app.channel(`emails/${user.email}`).join(connection)
			app.channel(`userIds/${user.id}`).join(connection)
		}
	})
}

app.publish((data, hook) => {
	// here you can add event publishers to channels set up in `channels.js`
	console.log(
		'Publishing all events to all authenticated users. See `channels.js` and https://docs.feathersjs.com/api/channels.html for more information.'
	)

	return app.channel('authenticated')
})

// here you can also add service specific event publishers
app.service('users').publish('created', () => app.channel('admins'))

app.service('messages').publish((data) => {
	return [
		app.channel(`userIds/${data.createdBy}`),
		app.channel(`emails/${data.recipientEmail}`),
	]
})
