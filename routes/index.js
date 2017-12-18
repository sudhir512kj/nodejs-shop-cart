var express = require('express');
var router = express.Router();
var Cart = require('../models/cart');

var Product = require('../models/product');

const keyPublishable = 'pk_test_gHblstVb94LWrDR5HcFxXlZu';
const keySecret = 'sk_test_ot45FEByXR2dhAEipmOc0SQV';

const stripe = require("stripe")(keySecret);

/* GET home page. */
router.get('/', function(req, res, next) {
  Product.find(function(err, docs) {
    var productChunks = [];
    var chunkSize = 3;
    for (var i = 0; i < docs.length; i+=chunkSize) {
      productChunks.push(docs.slice(i, i+chunkSize));
    }
    res.render('shop/index', { title: 'Shopping Cart', products: productChunks });
  });
});

router.get('/add-to-cart/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  Product.findById(productId, function(err, product) {
    if (err) {
      return res.redirect('/');
    }
    cart.add(product, product.id);
    req.session.cart = cart;
    console.log(req.session.cart);
    res.redirect('/');
  });
});

router.get('/shopping-cart', function(req, res, next) {
  if (!req.session.cart) {
    return res.render('shop/shopping-cart', {products: null});
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', function(req, res, next) {
  if (!req.session.cart) {
    return res.redirect('/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/checkout', {total: cart.totalPrice});
});

router.post("/charge", function(req, res) {

    let amount = req.body.chargeAmount*100;

    // create a customer
    stripe.customers.create({
        email: req.body.stripeEmail, // customer email, which user need to enter while making payment
        source: req.body.stripeToken // token for the given card
    })
    .then(customer =>
        stripe.charges.create({ // charge the customer
        amount,
        description: "Test payment",
            currency: "usd",
            customer: customer.id
        }))
    .then(req.session.cart = null)
    .then(charge => res.render("shop/charge")); // render the charge view: views/charge.pug

});

module.exports = router;
