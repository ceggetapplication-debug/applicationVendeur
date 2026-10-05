import { Group } from '../modals-others/modalStoreInfos';

export const getHomeGroupes = (tr: (key: string) => string): Group[] => [
    {
        id: 'groupe1',
        name: tr('courses_group'),
        photo: '',
        imageId: null,
        typesDeStore: [
            {
                id: 'superette', name: 'Superette', stores: [{
                    id: 'store1_superette', name: '', photo: '', categories: [
                        { id: 'superette_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'superette_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'superette_cat_laitiers', name: tr('prodLait'), imageId: null, productTypes: [
                                { id: 'superette_dairy_milkCream', name: tr('latekrm'), products: [] },
                                { id: 'superette_dairy_yogurtDesserts', name: tr('yogurtDessert'), products: [] },
                                { id: 'superette_dairy_cheese', name: tr('formaj'), products: [] },
                                { id: 'superette_dairy_butterMargarine', name: tr('beugheuMarg'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_petitdej', name: tr('ptidej'), imageId: null, productTypes: [
                                { id: 'superette_breakfast_cereals', name: tr('gato'), products: [] },
                                { id: 'superette_breakfast_chocolatConfiture', name: tr('chocoConf'), products: [] },
                                { id: 'superette_breakfast_cafethe', name: tr('cooffeeThe'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_bebes', name: tr('beb'), imageId: null, productTypes: [
                                { id: 'superette_bebe_savonShampoing', name: tr('savonBeb'), products: [] },
                                { id: 'superette_bebe_couchesLingettes', name: 'Couche & lingette', products: [] },
                                { id: 'superette_bebe_laitYaourt', name: tr('laitYaouBeb'), products: [] },
                                { id: 'superette_bebe_repasComplementaire', name: tr('tahyuqt'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_patisserie_sup', name: tr('patis'), imageId: null, productTypes: [
                                { id: 'superette_patisserie_farineSemoule', name: tr('farinaAw'), products: [] },
                                { id: 'superette_patisserie_sucreSirop', name: tr('sukkarSirp'), products: [] },
                                { id: 'superette_patisserie_aromesColorants', name: tr('romeColor'), products: [] },
                                { id: 'superette_patisserie_fruitsACoque', name: tr('caju'), products: [] },
                                { id: 'superette_patisserie_montageDecoration', name: tr('montage'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_patesgraines', name: tr('pat+graines'), imageId: null, productTypes: [
                                { id: 'superette_patesgraines_pates', name: tr('pasta'), products: [] },
                                { id: 'superette_patesgraines_riz_cous', name: tr('rroz'), products: [] },
                                { id: 'superette_patesgraines_legumesSecs', name: tr('luvyan'), products: [] },
                                { id: 'superette_patesgraines_mesure', name: tr('aLaMesure'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_condiments', name: tr('picerie'), imageId: null, productTypes: [
                                { id: 'superette_condiments_conserveFruitsConfits', name: tr('conserveBrqqIqqoren'), products: [] },
                                { id: 'superette_condiments_epices', name: tr('epss'), products: [] },
                                { id: 'superette_condiments_huileVinaigreSauce', name: tr('tasDeLiquides'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_snacks', name: tr('chipeuss'), imageId: null, productTypes: [
                                { id: 'superette_snacks_barresBonbons', name: tr('mars+flash'), products: [] },
                                { id: 'superette_snacks_chipsAmuseGueule', name: tr('chipeuseAmuz'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_boissons', name: tr('gazu'), imageId: null, productTypes: [
                                { id: 'superette_boissons_jusBouteille', name: tr('justeqraatt'), products: [] },
                                { id: 'superette_boissons_jusBoite', name: tr('justbewwat'), products: [] },
                                { id: 'superette_boissons_boissonsGazeuses', name: tr('gazuz'), products: [] },
                                { id: 'superette_boissons_eauMinerale', name: tr('amans3ida'), products: [] },
                            ]
                        },
                        {
                            id: 'superette_cat_hygiene', name: tr('tezdg'), imageId: null, productTypes: [
                                { id: 'superette_hygiene_corporelle', name: tr('tardaSav'), products: [] },
                                { id: 'superette_hygiene_ditergent', name: tr('sanibo'), products: [] },
                                { id: 'superette_hygiene_papierHygiene', name: tr('papHyg'), products: [] },
                                { id: 'superette_hygiene_lessiveVess', name: tr('lassiva'), products: [] },
                            ]
                        },
                        { id: 'superette_cat_autres', name: tr('otheur'), imageId: null },
                    ]
                }]
            },
            {
                id: 'epicerie', name: tr('epss'), stores: [{
                    id: 'store2_epicerie', name: '', photo: '', categories: [
                        { id: 'epicerie_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'epicerie_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        { id: 'epicerie_cat_epices', name: tr('pissPiss'), imageId: null, products: [] },
                        { id: 'epicerie_cat_epicesEnMesure', name: tr('pissmeuz'), imageId: null, products: [] },
                        { id: 'epicerie_cat_herbesAromatiques', name: tr('herbsro'), imageId: null, products: [] },
                        { id: 'epicerie_cat_fruitACoque', name: tr('caju'), imageId: null, products: [] },
                        { id: 'epicerie_cat_herbesMedicinales', name: tr('amagraman'), imageId: null, products: [] },
                        { id: 'epicerie_cat_autre', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'productsCosmetiques', name: tr('prodcos'), stores: [{
                    id: 'store3_productsCosmetiques', name: '', photo: '', categories: [
                        { id: 'productsCosmetiques_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'productsCosmetiques_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        { id: 'cosmetique_cat_visage', name: tr('dudum'), imageId: null, products: [] },
                        { id: 'cosmetique_cat_cheveux', name: tr('bubuv'), imageId: null, products: [] },
                        { id: 'cosmetique_cat_corps', name: tr('corpus'), imageId: null, products: [] },
                        { id: 'cosmetique_cat_autre', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'bureauTabac', name: tr('brtbc'), stores: [{
                    id: 'store4_bureauTabac', name: '', photo: '', categories: [
                        { id: 'bureauTabac_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'bureauTabac_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        { id: 'bureauTabac_cat_scolaire', name: tr('lakuy'), imageId: null, products: [] },
                        { id: 'bureauTabac_cat_hygiene', name: tr('teuzdeg'), imageId: null, products: [] },
                        { id: 'bureauTabac_cat_jouets', name: tr('lulluc'), imageId: null, products: [] },
                        { id: 'bureauTabac_cat_snacks', name: tr('chipeuss'), imageId: null, products: [] },
                        { id: 'bureauTabac_cat_autre', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'alimGle', name: tr('alim'), stores: [{
                    id: 'store5_alimGle2', name: '', photo: '', categories: [
                        { id: 'alimGle_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'alimGle_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        { id: 'alimGle_cat_laitiers', name: tr('prodLait'), imageId: null, products: [] },
                        { id: 'alimGle_cat_petitdej', name: tr('ptidej'), imageId: null, products: [] },
                        { id: 'alimGle_cat_patesgraines', name: tr('pat+graines'), imageId: null, products: [] },
                        { id: 'alimGle_cat_snacks', name: tr('chipeuss'), imageId: null, products: [] },
                        { id: 'alimGle_cat_boissons', name: tr('gazu'), imageId: null, products: [] },
                        { id: 'alimGle_cat_hygiene', name: tr('tezdg'), imageId: null, products: [] },
                        { id: 'alimGle_cat_fruitLegu', name: tr('frleg'), imageId: null, products: [] },
                        { id: 'superette_cat_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
        ],
    },
    {
        id: 'groupe2',
        name: tr('frais_group'),
        photo: '',
        imageId: null,
        typesDeStore: [
            {
                id: 'fruitsEtLegumes', name: tr('frleg'), stores: [{
                    id: 'store6_fruitsEtLegumes', name: '', photo: '', categories: [
                        { id: 'fruitsEtLegumes_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'fruitsEtLegumes_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        { id: 'fruitsEtLegumes_cat_fruits', name: tr('frotus'), imageId: null, products: [] },
                        { id: 'fruitsEtLegumes_cat_legumesVerts', name: tr('gumvrt'), imageId: null, products: [] },
                        { id: 'fruitsEtLegumes_cat_legumesRacines', name: tr('izzuran'), imageId: null, products: [] },
                        { id: 'fruitsEtLegumes_cat_autre', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'boucherieViandeRouge', name: tr('bcvr'), stores: [{
                    id: 'store7_boucherieViandeRouge', name: '', photo: '', categories: [
                        { id: 'boucherieViandeRouge_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'boucherieViandeRouge_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'boucherieViandeRouge_cat_boeuf', name: tr('zageur'), imageId: null, productTypes: [
                                { id: 'boucherieViandeRouge_boeuf_cuisseEpaule', name: tr('amessadTayett'), products: [] },
                                { id: 'boucherieViandeRouge_boeuf_cotePoitrineFlanc', name: tr('flancCote'), products: [] },
                                { id: 'boucherieViandeRouge_boeuf_tetePattesLangue', name: tr('vuzelluf'), products: [] },
                                { id: 'boucherieViandeRouge_boeuf_organesTripes', name: tr('ddwara'), products: [] },
                            ]
                        },
                        {
                            id: 'boucherieViandeRouge_cat_mouton', name: tr('kerr'), imageId: null, productTypes: [
                                { id: 'boucherieViandeRouge_mouton_gigotEpaule', name: tr('gigotTayett'), products: [] },
                                { id: 'boucherieViandeRouge_mouton_cotePoitrine', name: tr('cotePoit'), products: [] },
                                { id: 'boucherieViandeRouge_mouton_filetCollier', name: tr('filetColl'), products: [] },
                                { id: 'boucherieViandeRouge_mouton_tetePattesLangue', name: tr('vuzelluf'), products: [] },
                                { id: 'boucherieViandeRouge_mouton_organesTripes', name: tr('ddwara'), products: [] },
                            ]
                        },
                        {
                            id: 'boucherieViandeRouge_cat_cheval', name: tr('aawdiw'), imageId: null, productTypes: [
                                { id: 'boucherieViandeRouge_cheval_rampeEpaule', name: tr('rampeTayett'), products: [] },
                                { id: 'boucherieViandeRouge_cheval_flancPoitrine', name: tr('flancPoitPoit'), products: [] },
                                { id: 'boucherieViandeRouge_cheval_filetCollier', name: tr('filetColl'), products: [] },
                            ]
                        },
                        { id: 'boucherieViandeRouge_cat_importation', name: tr('portation'), imageId: null, products: [] },
                        { id: 'boucherieViandeRouge_cat_specialites', name: tr('specialites'), imageId: null, products: [] },
                        { id: 'boucherieViandeRouge_cat_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'boucherieViandeBlanche', name: tr('bcvb'), stores: [{
                    id: 'store8_boucherieViandeBlanche', name: '', photo: '', categories: [
                        { id: 'boucherieViandeBlanche_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'boucherieViandeBlanche_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'boucherieViandeBlanche_cat_poulet', name: tr('ayazid'), imageId: null, productTypes: [
                                { id: 'boucherieViandeBlanche_poulet_entierCarcasse', name: tr('zazitMehrakis'), products: [] },
                                { id: 'boucherieViandeBlanche_poulet_cuissesAils', name: tr('imessadenIfriwen'), products: [] },
                                { id: 'boucherieViandeBlanche_poulet_poitrineEscalope', name: tr('idmerSkalop'), products: [] },
                                { id: 'boucherieViandeBlanche_poulet_abats_oeufs', name: tr('abatsVlavlac'), products: [] },
                            ]
                        },
                        {
                            id: 'boucherieViandeBlanche_cat_dinde', name: tr('dandu'), imageId: null, productTypes: [
                                { id: 'boucherieViandeBlanche_dinde_cuissesAils', name: tr('imessadenIfriwen'), products: [] },
                                { id: 'boucherieViandeBlanche_dinde_poitrineEscalope', name: tr('idmerSkalop'), products: [] },
                            ]
                        },
                        { id: 'boucherieViandeBlanche_cat_caille', name: tr('caille'), imageId: null, products: [] },
                        { id: 'boucherieViandeBlanche_cat_specialites', name: tr('specialites'), imageId: null, products: [] },
                        { id: 'boucherieViandeRouge_cat_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'poissonerie', name: tr('pss'), stores: [{
                    id: 'store9_poissonerie', name: '', photo: '', categories: [
                        { id: 'poissonerie_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'poissonerie_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        { id: 'poissonerie_cat_sardineBle', name: tr('sardinBle'), imageId: null, products: [] },
                        { id: 'poissonerie_cat_sardineBlc', name: tr('sardinBlc'), imageId: null, products: [] },
                        { id: 'poissonerie_cat_sardineBig', name: tr('sardinBig'), imageId: null, products: [] },
                        { id: 'poissonerie_cat_autre', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
        ],
    },
    {
        id: 'groupe3',
        name: tr('collation_group'),
        photo: '',
        imageId: null,
        typesDeStore: [
            {
                id: 'pizzeriaPatisserie', name: tr('pzpat'), stores: [{
                    id: 'store10_pizzeriaPatisserie', name: '', photo: '', categories: [
                        { id: 'pizzeriaPatisserie_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'pizzeriaPatisserie_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'pizzeriaPatisserie_cat_pizzaCalzone', name: tr('pizzaSoufflet'), imageId: null, productTypes: [
                                { id: 'pizzeriaPatisserie_pizza_pizza', name: tr('pizzas'), products: [] },
                                { id: 'pizzeriaPatisserie_pizza_pizzaFourreeCarree', name: tr('pizzaFourrCarre'), products: [] },
                                { id: 'pizzeriaPatisserie_pizza_calzoneQuiche', name: tr('calzoneQuiche'), products: [] },
                            ]
                        },
                        {
                            id: 'pizzeriaPatisserie_cat_viennoiserie', name: tr('crwasso'), imageId: null, productTypes: [
                                { id: 'pizzeriaPatisserie_viennoiserie_brioches', name: 'Brioche', products: [] },
                                { id: 'pizzeriaPatisserie_viennoiserie_feuilletee', name: 'Feuilleté', products: [] },
                            ]
                        },
                        {
                            id: 'pizzeriaPatisserie_cat_patisserie', name: tr('tapatissri'), imageId: null, productTypes: [
                                { id: 'pizzeriaPatisserie_patisserie_genoiseMilleFeuilles', name: tr('napoGen'), products: [] },
                                { id: 'pizzeriaPatisserie_patisserie_tarteletteEclair', name: tr('jupiTarte'), products: [] },
                                { id: 'pizzeriaPatisserie_patisserie_gateau', name: tr('gatto'), products: [] },
                            ]
                        },
                        { id: 'pizzeriaPatisserie_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'gateauxTraditionnels', name: tr('gatrad'), stores: [{
                    id: 'store11_gateauxTraditionnels', name: '', photo: '', categories: [
                        { id: 'gateauxTraditionnels_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'gateauxTraditionnels_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'gateauxTraditionnel_cat_galette', name: tr('habul'), imageId: null, productTypes: [
                                { id: 'gateauxTraditionnel_galette_tamtunt', name: tr('tamtut'), products: [] },
                                { id: 'gateauxTraditionnel_galette_aghrumUneeruk', name: tr('aghrumUnaaruk'), products: [] },
                                { id: 'gateauxTraditionnel_galette_lesfenj', name: tr('yexfaf'), products: [] },
                            ]
                        },
                        {
                            id: 'gateauxTraditionnel_cat_biscuit', name: tr('biscotto'), imageId: null, productTypes: [
                                { id: 'gateauxTraditionnel_biscuit_simples', name: tr('simple'), products: [] },
                                { id: 'gateauxTraditionnel_biscuit_enrobesFourrees', name: tr('enrobeFourre'), products: [] },
                            ]
                        },
                        {
                            id: 'gateauxTraditionnel_cat_extrasucre', name: tr('xtraSucre'), imageId: null, productTypes: [
                                { id: 'gateauxTraditionnel_extrasucre_meqrutBaqlawa', name: tr('baklavaMak'), products: [] },
                                { id: 'gateauxTraditionnel_extrasucre_fruitACoque', name: tr('sJJuj'), products: [] },
                                { id: 'gateauxTraditionnel_extrasucre_dessertRamdan', name: tr('dessertRamdan'), products: [] },
                            ]
                        },
                        {
                            id: 'gateauxTraditionnel_cat_decore', name: tr('dekoree'), imageId: null, productTypes: [
                                { id: 'gateauxTraditionnel_decore_glacagePateSucre', name: tr('glassaje'), products: [] },
                                { id: 'gateauxTraditionnel_decore_autresDecorations', name: tr('autredeco'), products: [] },
                            ]
                        },
                        { id: 'gateauxTraditionnel_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'boulangerie', name: tr('blnj'), stores: [{
                    id: 'store12_boulangerie', name: '', photo: '', categories: [
                        { id: 'boulangerie_cat_promotion', name: tr('prom'), imageId: null, products: [] },
                        { id: 'boulangerie_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'boulangerie_cat_pain', name: tr('ghrom'), imageId: null, productTypes: [
                                { id: 'boulangerie_pain_bleOrge', name: tr('irdenTimzzin'), products: [] },
                                { id: 'boulangerie_pain_oliveNigelle', name: tr('azemmurSanudj'), products: [] },
                                { id: 'boulangerie_pain_rond', name: tr('ahvuy'), products: [] },
                            ]
                        },
                        {
                            id: 'boulangerie_cat_viennoiserie', name: tr('crwasso'), imageId: null, productTypes: [
                                { id: 'boulangerie_viennoiserie_brioche', name: 'Brioche', products: [] },
                                { id: 'boulangerie_viennoiserie_feuilletee', name: 'Feuilleté', products: [] },
                            ]
                        },
                        {
                            id: 'boulangerie_cat_galette', name: tr('habul'), imageId: null, productTypes: [
                                { id: 'boulangerie_galette_tamtunt', name: tr('tamtut'), products: [] },
                                { id: 'boulangerie_galette_aghrumUneeruk', name: tr('aghrumUnaaruk'), products: [] },
                            ]
                        },
                        { id: 'boulangerie_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
        ],
    },
    {
        id: 'groupe4',
        name: tr('restauration_group'),
        photo: '',
        imageId: null,
        typesDeStore: [
            {
                id: 'fastFood', name: tr('fast'), stores: [{
                    id: 'store13_fastFood', name: '', photo: '', categories: [
                        { id: 'fastFood_promotions', name: tr('prom'), imageId: null, products: [] },
                        { id: 'fastFood_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'fastFood_cat_pizza&', name: 'Pizza &', imageId: null, productTypes: [
                                { id: 'fastFood_pizza_pizza', name: 'Pizza', products: [] },
                                { id: 'fastFood_pizza_calzone', name: 'Calzone (soufflé)', products: [] },
                                { id: 'fastFood_pizza_quiche', name: 'Quiche', products: [] },
                            ]
                        },
                        { id: 'fastFood_cat_tacos', name: 'Tacos', imageId: null, products: [] },
                        {
                            id: 'fastFood_cat_plats', name: tr('plateu'), imageId: null, productTypes: [
                                { id: 'fastFood_plat_viande', name: tr('kessoum'), products: [] },
                                { id: 'fastFood_plat_poulet', name: tr('ayazid'), products: [] },
                                { id: 'fastFood_plat_shawarma', name: 'Shawarma', products: [] },
                                { id: 'fastFood_plat_salade', name: tr('chalata'), products: [] },
                            ]
                        },
                        { id: 'fastFood_cat_sandwichs', name: 'Sandwichs', imageId: null, products: [] },
                        { id: 'fastFood_cat_galette', name: tr('habul'), imageId: null, products: [] },
                        { id: 'fastFood_cat_burger', name: 'Hamburger', imageId: null, products: [] },
                        {
                            id: 'fastFood_cat_supl', name: tr('suppel'), imageId: null, productTypes: [
                                { id: 'fastFood_supplement_frites', name: 'Frites', products: [] },
                                { id: 'fastFood_supplement_viandePouletShawarma', name: tr('kessZizittShawar'), products: [] },
                                { id: 'fastFood_supplement_fromage', name: tr('formaj'), products: [] },
                                { id: 'fastFood_supplement_salade', name: tr('chalata'), products: [] },
                                { id: 'fastFood_supplement_oeuf', name: tr('mellalt'), products: [] },
                            ]
                        },
                        {
                            id: 'fastFood_cat_boisson', name: tr('gazu'), imageId: null, productTypes: [
                                { id: 'fastFood_boisson_eau', name: tr('amans3ida'), products: [] },
                                { id: 'fastFood_boisson_jus', name: tr('jusGle'), products: [] },
                                { id: 'fastFood_boisson_boissonGazeuse', name: tr('gazuz'), products: [] },
                                { id: 'fastFood_boisson_canetteBoites', name: tr('canidBewat'), products: [] },
                            ]
                        },
                        { id: 'fastFood_cat_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'restaurant', name: tr('rest'), stores: [{
                    id: 'store14_restaurant', name: '', photo: '', categories: [
                        { id: 'restaurant_promotions', name: tr('prom'), imageId: null, products: [] },
                        { id: 'restaurant_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        {
                            id: 'restaurant_cat_entrees', name: tr('begin'), imageId: null, productTypes: [
                                { id: 'restaurant_entree_chaude', name: tr('hot'), products: [] },
                                { id: 'restaurant_entree_froide', name: tr('cold'), products: [] },
                            ]
                        },
                        {
                            id: 'restaurant_cat_plats', name: tr('plateu'), imageId: null, productTypes: [
                                { id: 'restaurant_plat_melange', name: tr('mix'), products: [] },
                                { id: 'restaurant_plat_demi', name: tr('half'), products: [] },
                            ]
                        },
                        { id: 'restaurant_cat_desserts', name: tr('dessereut'), imageId: null, products: [] },
                        {
                            id: 'restaurant_cat_viande', name: tr('kessoum'), imageId: null, productTypes: [
                                { id: 'restaurant_viande_viande', name: tr('kessoum'), products: [] },
                                { id: 'restaurant_viande_poulet', name: tr('ayazid'), products: [] },
                                { id: 'restaurant_viande_merguez', name: tr('margaz'), products: [] },
                            ]
                        },
                        { id: 'restaurant_cat_sandwichs', name: 'Sandwichs', imageId: null, products: [] },
                        {
                            id: 'restaurant_cat_boisson', name: tr('gazu'), imageId: null, productTypes: [
                                { id: 'restaurant_boisson_eau', name: tr('amans3ida'), products: [] },
                                { id: 'restaurant_boisson_jus', name: tr('jusGle'), products: [] },
                                { id: 'restaurant_boisson_boissonGazeuse', name: tr('gazuz'), products: [] },
                                { id: 'restaurant_boisson_canetteBoite', name: tr('canidBewat'), products: [] },
                            ]
                        },
                        { id: 'restaurant_cat_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
            {
                id: 'cremerie', name: tr('cremerie'), stores: [{
                    id: 'store15_cremerie', name: '', photo: '', categories: [
                        { id: 'cremerie_promotions', name: tr('prom'), imageId: null, products: [] },
                        { id: 'cremerie_topVentes', name: tr('topVente'), imageId: null, products: [] },
                        { id: 'cremerie_cat_seksu', name: tr('coucouss'), imageId: null, products: [] },
                        { id: 'cremerie_cat_plats', name: tr('plateu'), imageId: null, products: [] },
                        { id: 'cremerie_cat_sandwichs', name: 'Sandwichs', imageId: null, products: [] },
                        {
                            id: 'cremerie_cat_productsLaitiers', name: tr('prodLait'), imageId: null, productTypes: [
                                { id: 'cremerie_productsLaitiers_ighiIkkiyAyefki', name: tr('lattus'), products: [] },
                                { id: 'cremerie_productsLaitiers_fromage', name: tr('formaj'), products: [] },
                                { id: 'cremerie_productsLaitiers_udiCreme', name: tr('kess'), products: [] },
                            ]
                        },
                        { id: 'cremerie_cat_supl', name: tr('suppel'), imageId: null, products: [] },
                        {
                            id: 'cremerie_cat_boisson', name: tr('gazu'), imageId: null, productTypes: [
                                { id: 'cremerie_boisson_eau', name: tr('amans3ida'), products: [] },
                                { id: 'cremerie_boisson_jus', name: tr('jusGle'), products: [] },
                                { id: 'cremerie_boisson_boissonGazeuse', name: tr('gazuz'), products: [] },
                                { id: 'cremerie_boisson_canetteBoites', name: tr('canidBewat'), products: [] },
                            ]
                        },
                        { id: 'cremerie_cat_autres', name: tr('otheur'), imageId: null, products: [] },
                    ]
                }]
            },
        ],
    },
    {
        id: 'groupe5',
        name: tr('store_group'),
        photo: '',
        imageId: null,
        typesDeStore: [
            { id: 'superette', name: 'Superette', storesD: [] },
            { id: 'epicerie', name: tr('epss'), storesD: [] },
            { id: 'productsCosmetiques', name: tr('prodcos'), storesD: [] },
            { id: 'bureauTabac', name: tr('brtbc'), storesD: [] },
            { id: 'alimGle', name: tr('alim'), storesD: [] },
            { id: 'fruitsEtLegumes', name: tr('frleg'), storesD: [] },
            { id: 'boucherieViandeRouge', name: tr('bcvr'), storesD: [] },
            { id: 'boucherieViandeBlanche', name: tr('bcvb'), storesD: [] },
            { id: 'poissonerie', name: tr('pss'), storesD: [] },
            { id: 'pizzeriaPatisserie', name: tr('pzpat'), storesD: [] },
            { id: 'gateauxTraditionnels', name: tr('gatrad'), storesD: [] },
            { id: 'boulangerie', name: tr('blnj'), storesD: [] },
            { id: 'fastFood', name: tr('fast'), storesD: [] },
            { id: 'restaurant', name: tr('rest'), storesD: [] },
            { id: 'cremerie', name: tr('cremerie'), storesD: [] },
        ],
    },
];
