const BoxSchema = require('../model/BoxSchema');
const BoxOpenSchema = require('../model/BoxSchema');
const TagSchema = require('../model/TagSchema');

const HomeController = {
  index: async (req, res) => {
    // const tag = await TagSchema.findOne({ name: 'featured' });

    const data = await BoxSchema.aggregate([
        // {
        //     $match: { tags: tag._id }
        // },
        {
            $lookup: {
                from: 'tags',
                localField: 'tags',
                foreignField: '_id',
                as: 'tags'
            }
        }, {
            $addFields: { "length": { $size: "$tags" } }
        }, {
            $addFields: { "icon": { $concat: [`${process.env.LINK}/`, "$icon_path"] } }
        },{
            $sort: { "length": -1 }
        }, {
            $limit: 24
        }, {
            $project: {
                _id: 0, ancestor_box: 1, code: 1, name: 1, cost: 1, original_price: 1,
                currency: 1, icon: 1, level_required: 1, order: 1, slug: 1,
                "tags.code": 1, "tags.name": 1, "tags.visible": 1, "tags.color": 1
                }
        }
    ]);

    return res.status(200).json({ data })
  },

  getFooterData: (req, res) => {
    // TODO: get the footer data from db. FooterMenu, FooterRow, FooterColumn, FooterCell, FooterCellItems
    
    res.status(200).send({
        rows: [
            {
                classes: "justify-content-center",
                columns: [
                    {
                        classes: null,
                        cells: [
                            {
                                isRow: true,
                                classes: "social-row justify-content-center",
                                cellItems: [
                                    {
                                        classes: "social-link facebook",
                                        link: "https://www.facebook.com",
                                        isNewTab: true,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/a9c4c80c-3d78-4b94-88a5-d10c3c5156a3/facebook.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                            
                                        },
                                        text: null,
                                        visibleFor: null,
                                        
                                    },
                                    {
                                        classes: "social-link twitter",
                                        link: "https://twitter.com",
                                        isNewTab: true,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/e5c2378f-d217-4c63-9dba-753d5e1a320e/twitter.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "social-link instagram",
                                        link: "https://www.instagram.com",
                                        isNewTab: true,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/a981d239-7702-4145-a7c6-0d605c8b41fb/instagram.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "social-link discord",
                                        link: "https://discord.com/",
                                        isNewTab: true,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/6699f83b-3e7b-4fc6-987d-2f02a5349fe3/discord.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "social-link tiktok",
                                        link: "https://www.tiktok.com/",
                                        isNewTab: true,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/d37a5182-cf9a-4fb8-9964-232c1e6b17ea/tiktok3_new.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "social-link youtube",
                                        link: "https://www.youtube.com",
                                        isNewTab: true,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/ea3ac4b9-fef4-44c6-8258-ad43ae805cc8/youtube.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "social-link twitch",
                                        link: "https://www.twitch.tv",
                                        isNewTab: true,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/cd06f50a-c536-4d0f-a642-df650650938b/twitch.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    }
                                ],
                            }
                        ],
                    }
                ],
            },
            {
                classes: "justify-content-center",
                columns: [
                    {
                        classes: null,
                        cells: [
                            {
                                isRow: true,
                                classes: "payments grayscale align-items-center ",
                                cellItems: [
                                    {
                                        classes: null,
                                        link: null,
                                        isNewTab: null,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/945efcaa-46a2-47d7-84a7-00d9b8a1d4e8/visa.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "ml-5",
                                        link: null,
                                        isNewTab: null,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/684151c6-4980-4c98-8f1d-ae99843e45a8/mastercard.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "ml-5",
                                        link: null,
                                        isNewTab: null,
                                        image: {
                                           path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/8b541301-cdbb-48c7-9147-ee653163ecfa/paypal.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "gift-card ml-5",
                                        link: null,
                                        isNewTab: null,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/1eaef11b-4c42-4a03-8f8b-4616952a4a6a/gift-card.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: null,
                                        visibleFor: null,     
                                    }
                                ],    
                            }
                        ],  
                    }
                ],
            },
            {
                classes: "justify-content-center",
                columns: [
                    {
                        classes: null,
                        cells: [
                            {
                                isRow: true,
                                classes: "nav row-wrap  justify-content-center",
                                cellItems: [
                                    {
                                        classes: "nav-item nav-link",
                                        link: "/support",
                                        isNewTab: null,
                                        image: {
                                            path: "3ef0af8f-1a51-4538-a110-ed43f472fc3e/dev/95a1b749-7954-49ae-97c9-fdd98f32b216/contact-support.svg",
                                            description: null,
                                            backgroundColor: null,
                                            mimeType: "image/svg+xml",
                                        },
                                        text: "CONTACT",
                                        visibleFor: "all",
                                    },
                                    {
                                       classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: "all",
                                      
                                    },
                                    {
                                       classes: "nav-item nav-link",
                                        link: '',
                                        isNewTab: true,
                                        image: null,
                                        text: "BLOG",
                                        visibleFor: "all",
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "nav-item nav-link",
                                        link: "/info/faq",
                                        isNewTab: null,
                                        image: null,
                                        text: "FAQ",
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "nav-item nav-link",
                                        link: "/info/terms-of-service",
                                        isNewTab: null,
                                        image: null,
                                        text: "TERMS OF SERVICE",
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "nav-item nav-link",
                                        link: "/info/privacy-statement",
                                        isNewTab: null,
                                        image: null,
                                        text: " PRIVACY STATEMENT",
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "nav-item nav-link",
                                        link: "/info/provably-fair",
                                        isNewTab: null,
                                        image: null,
                                        text: " PROVABLY FAIR",
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                       classes: "nav-item nav-link",
                                        link: "/info/cookie-policy",
                                        isNewTab: null,
                                        image: null,
                                        text: " COOKIE POLICY",
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "nav-item nav-link",
                                        link: "/info/aml-policy",
                                        isNewTab: null,
                                        image: null,
                                        text: " AML POLICY",
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: null,
                                    },
                                    {
                                        classes: "nav-item nav-link text-success",
                                        link: "/boxes/eu/daily-free",
                                        isNewTab: null,
                                        image: null,
                                        text: "FREE DROP",
                                        visibleFor: "loggedIn",
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: "loggedIn",
                                    },
                                    {
                                        classes: "nav-item nav-link",
                                       
                                        isNewTab: null,
                                        image: null,
                                        text: " LOG OUT",
                                        visibleFor: "loggedIn",
                                    },
                                    {
                                        classes: "separator",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: null,
                                        visibleFor: "loggedIn",
                                    }
                                ],
                            }
                        ],
                    }
                ],
            },
            {
                classes: "justify-content-center",
                columns: [
                    {
                        classes: null,
                        cells: [
                            {
                                isRow: true,
                                classes: null,
                                cellItems: [
                                    {
                                        classes: "license license-text",
                                        link: null,
                                        isNewTab: null,
                                        image: null,
                                        text: "Caycdrop ...",
                                        visibleFor: null,
                                    }
                                ],
                            }
                        ],
                    }
                ],
            }
        ],
    });
  }
}

module.exports = HomeController;