const express = require("express");
const router = express.Router();
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");
const Offer = require("../models/Offer");
const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      console.log("body => ", req.body);
      console.log("files => ", req.files);
      console.log("token => ", req.headers.authorization);

      console.log("req.user => ", req.user);

      //   const user = await User.findOne({
      //     token: req.header.authorization.replace("Bearer ", ""),
      //   });

      // Uploader mon image reçue sur cloudinary qui va me répondre un objet contenant des infos sur l'image uploadée

      const base64Image = convertToBase64(req.files.picture);
      //   console.log(base64Image);

      const cloudinaryResponse = await cloudinary.uploader.upload(base64Image);

      //   console.log("cloudinaryResponse => ", cloudinaryResponse);

      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          {
            MARQUE: req.body.brand,
          },
          {
            TAILLE: req.body.size,
          },
          {
            ÉTAT: req.body.condition,
          },
          {
            COULEUR: req.body.color,
          },
          {
            EMPLACEMENT: req.body.city,
          },
        ],
        product_image: cloudinaryResponse,
        owner: req.user._id,
      });

      console.log("newOffer => ", newOffer);

      //   const offer = await Offer.findById(newOffer._id).populate("owner");

      await newOffer.save();

      await newOffer.populate("owner", "account email");

      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.get("/offers", async (req, res) => {
  try {
    console.log("req.query => ", req.query);

    // const filters = {
    //   product_name: new RegExp(req.query.title, "i"),
    //   product_price: {
    //     $gte: req.query.priceMin,
    //   },
    // };

    const filters = {};

    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      filters.product_price = {
        $gte: Number(req.query.priceMin),
      };
    }

    // console.log("test filters => ", filters);

    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = {
          $lte: Number(req.query.priceMax),
        };
      }
    }

    console.log("final filters => ", filters);

    const sortFilters = {};

    if (req.query.sort === "price-desc") {
      sortFilters.product_price = "descending";
    } else if (req.query.sort === "price-asc") {
      sortFilters.product_price = "ascending";
    }

    console.log("sortFilter => ", sortFilters);

    const limitFilter = 2;

    let pageFilter = 1;

    if (req.query.page) {
      pageFilter = req.query.page;
    }

    // 5 résultats par page : page 1 => 0, page 2 => 5, page 3 => 10, page 4 => 15
    // 3 résultats par page : page 1 => 0, page 2 => 3, page 3 => 6, page 4 => 9

    // (numéro de page - 1) * nb de résultat par page

    const skipFilter = (pageFilter - 1) * limitFilter;

    const offers = await Offer.find(filters)
      .sort(sortFilters)
      .skip(skipFilter)
      .limit(limitFilter)
      .populate("owner", "account");
    // .select("product_name product_price");

    const count = await Offer.countDocuments(filters);
    console.log("count => ", count);

    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account",
    );
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
