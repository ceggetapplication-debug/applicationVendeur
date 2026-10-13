export interface Commune {
    id: string;
    name: string;
}

export interface Daira {
    id: string;
    name: string;
    communes: Commune[];
}
export const DEFAULT_ACTIVE_DAIRAS = ['daira_beni_douala'];
export const DAIRAS_CONFIG: Daira[] = [
    {
        id: 'daira_azazga',
        name: 'Iɛeẓẓugen',
        communes: [
            { id: 'com_azazga', name: 'Iɛeẓẓugen' },
            { id: 'com_freha', name: 'Friḥa' },
            { id: 'com_ifigha', name: 'Ifiɣa' },
            { id: 'com_yakouren', name: 'Iɛekkuren' },
            { id: 'com_zekri', name: 'Zekri' }
        ]
    },
    {
        id: 'daira_azeffoun',
        name: 'Aẓeffun',
        communes: [
            { id: 'com_azeffoun', name: 'Aẓeffun' },
            { id: 'com_ait_chafaa', name: 'At Cafeɛ' },
            { id: 'com_akerrou', name: 'Aqeṛṛu' },
            { id: 'com_aghribs', name: 'Aɣṛiv' }
        ]
    },
    {
        id: 'daira_larbaa_nath_irathen',
        name: 'Larbaâ Nath Irathen',
        communes: [
            { id: 'com_larbaa_nath_irathen', name: 'Larbaâ Nath Irathen' },
            { id: 'com_ait_aggouacha', name: 'At Ɛeggaca' },
            { id: 'com_irdjen', name: 'Irjen' }
        ]
    },
    {
        id: 'daira_draa_el_mizan',
        name: 'Draɛ n Lmizan',
        communes: [
            { id: 'com_draa_el_mizan', name: 'Draɛ n Lmizan' },
            { id: 'com_ain_zaouia', name: 'Ɛin n Zzawiya' },
            { id: 'com_ait_yahia_moussa', name: 'At Yaḥya Musa' },
            { id: 'com_frikat', name: 'Frikat' }
        ]
    },
    {
        id: 'daira_boghni',
        name: 'Vuɣni',
        communes: [
            { id: 'com_boghni', name: 'Vuɣni' },
            { id: 'com_bounouh', name: 'Vunuḥ' },
            { id: 'com_assi_youcef', name: 'At Si Yusef' },
            { id: 'com_mechtras', name: 'Amecṛas' }
        ]
    },
    {
        id: 'daira_tigzirt',
        name: 'Tigzirt',
        communes: [
            { id: 'com_tigzirt', name: 'Tigzirt' },
            { id: 'com_iflissen', name: 'Iflissen' },
            { id: 'com_mizrana', name: 'Mizṛana' }
        ]
    },
    {
        id: 'daira_bouzeguene',
        name: 'Vuzeggan',
        communes: [
            { id: 'com_bouzeguene', name: 'Vuzeggan' },
            { id: 'com_beni_zki', name: 'At Ziki' },
            { id: 'com_illoula_oumalou', name: 'Illula Umalu' },
            { id: 'com_idjeur', name: 'At Iǧǧeṛ' }
        ]
    },
    {
        id: 'daira_ain_el_hammam',
        name: 'Micli',
        communes: [
            { id: 'com_ain_el_hammam', name: 'Micli' },
            { id: 'com_abi_youcef', name: 'Abi Yusef' },
            { id: 'com_ait_yahia', name: 'At Yeḥya' },
            { id: 'com_akbil', name: 'Aqvil' }
        ]
    },
    {
        id: 'daira_beni_douala',
        name: 'At Dwala',
        communes: [
            { id: 'com_beni_douala', name: 'At Dwala' },
            { id: 'com_ait_mahmoud', name: 'At Maḥmud' },
            { id: 'com_beni_aissi', name: 'Beni Aïssi' },
            { id: 'com_beni_zmenzer', name: 'At Zmenzer' }
        ]
    },
    {
        id: 'daira_autre',
        name: 'Tiyaḍ',
        communes: [
            { id: 'com_beni_douala', name: 'Iḥesnawen' }
        ]
    },
    {
        id: 'daira_beni_yenni',
        name: 'At Yanni',
        communes: [
            { id: 'com_beni_yenni', name: 'At Yanni' },
            { id: 'com_iboudraren', name: 'Ivudraren' },
            { id: 'com_yatafen', name: 'Iɛeṭṭafen' }
        ]
    },
    {
        id: 'daira_ouadhia',
        name: 'Iwaḍiyen',
        communes: [
            { id: 'com_ouadhia', name: 'Iwaḍiyen' },
            { id: 'com_agouni_gueghrane', name: 'Aguni Geɣran' },
            { id: 'com_ait_bouaddou', name: 'At Vuwaddu' },
            { id: 'com_tizi_ntleta', name: 'Tizi N\'Ţleta' }
        ]
    },
    {
        id: 'daira_ouacif',
        name: 'At Wasif',
        communes: [
            { id: 'com_ouacif', name: 'At Wasif' },
            { id: 'com_ait_toudert', name: 'At Tudert' }
        ]
    },
    {
        id: 'daira_ouaguenoun',
        name: 'At Wagennun',
        communes: [
            { id: 'com_ouaguenoun', name: 'At Wagennun' },
            { id: 'com_ait_aissa_mimoun', name: 'At Ɛisa Mimun' },
            { id: 'com_timizart', name: 'Timizart' }
        ]
    },
    {
        id: 'daira_makouba',
        name: 'Makuda',
        communes: [
            { id: 'com_makouba', name: 'Makuda' },
            { id: 'com_boudjima', name: 'Vuǧima' }
        ]
    },
    {
        id: 'daira_mekla',
        name: 'Meqlaɛ',
        communes: [
            { id: 'com_mekla', name: 'Meqleɛ' },
            { id: 'com_ait_khellili', name: 'At Xellili' },
            { id: 'com_souamaa', name: 'Swameɛ' }
        ]
    },
    {
        id: 'daira_tizi_gheniff',
        name: 'Tizi Gheniff',
        communes: [
            { id: 'com_tizi_gheniff', name: 'Tizi Gheniff' },
            { id: 'com_mkaouba', name: 'M\'Kira' }
        ]
    },
    {
        id: 'daira_iftissen',
        name: 'Iferhounène',
        communes: [
            { id: 'com_iferhounene', name: 'Iferhounène' },
            { id: 'com_ahsen_oumalou', name: 'Amsroun' },
            { id: 'com_illilten', name: 'Illilten' }
        ]
    },
    {
        id: 'daira_maatkas',
        name: 'Maɛetqa',
        communes: [
            { id: 'com_maatkas', name: 'Maɛetqa' },
            { id: 'com_souk_el_tenine', name: 'Ssuq n Letniyen' }
        ]
    }
];

export function isSameDaira(communeAcheteur: string, communeMagasin: string): boolean {
    if (!communeAcheteur || !communeMagasin) return false;
    const normA = communeAcheteur.trim().toLowerCase();
    const normM = communeMagasin.trim().toLowerCase();

    for (const daira of DAIRAS_CONFIG) {
        const hasA = daira.communes.some(c => c.id.toLowerCase() === normA || c.name.toLowerCase() === normA);
        const hasM = daira.communes.some(c => c.id.toLowerCase() === normM || c.name.toLowerCase() === normM);
        if (hasA && hasM) {
            return true;
        }
    }
    return false;
}