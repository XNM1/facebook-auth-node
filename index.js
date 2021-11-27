const express = require('express')
const app = express()
const hbs = require('express-hbs')
const cookieSession = require('cookie-session')
const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy

passport.serializeUser(function (user, done) {
    done(null, user)
})

passport.deserializeUser(function (obj, done) {
    done(null, obj)
})

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `https://${process.env.HOST}:${process.env.PORT}${process.env.FACEBOOK_CALLBACK_URL}`
    },
    function (accessToken, refreshToken, profile, cb) {
        return cb(null, profile)
    }
))

const authorizationMiddleware = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.redirect("/login")
    }
}
const facebookAuthentication = passport.authenticate('facebook')
const facebookAuthenticationCallback = passport.authenticate('facebook', {
    failureRedirect: '/login'
}, (req, res) => {
    res.redirect('/')
})

app.use(cookieSession({
    maxAge: 90 * 24 * 60 * 60 * 1000,
    keys: [process.env.SESSION_KEY]
}))

app.use(passport.initialize())
app.use(passport.session())

app.engine('handlebars', hbs.express4())
app.set('view engine', 'handlebars')
app.set('views', './views')

app.get('/', authorizationMiddleware, (req, res) => {
    res.render('home', {
        id: req.user.id,
        name: req.user.displayName
    })
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/auth/facebook', facebookAuthentication)

app.get('/auth/facebook/callback', facebookAuthenticationCallback)

app.get('/logout', authorizationMiddleware, (req, res) => {
    req.session = null
    req.logout()
    res.redirect('/login')
})

app.listen(process.env.PORT, function () {
    console.log(`Server listens https://${process.env.HOST}:${process.env.PORT}`)
})