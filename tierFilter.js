const GEN9OU_POKEMON = [
    "alomomola", "araquanid", "cinderace", "clefable", "corviknight",
    "darkrai", "dondozo", "dragapult", "dragonite", "enamorus",
    "garganacl", "gholdengo", "glimmora", "gliscor", "great tusk",
    "hatterene", "iron crown", "iron moth", "iron treads", "iron valiant",
    "kingambit", "kyurem", "landorus therian", "moltres", "ogerpon wellspring",
    "pecharunt", "primarina", "raging bolt", "samurott hisui", "slowking galar",
    "ting lu", "tinkaton", "walking wake", "weavile", "zamazenta hero", "zapdos"
];

function setupTierSelector() {
    const tierButton = document.getElementById('tierButton');
    const tierOptions = document.getElementById('tierOptions');
    
    tierButton.addEventListener('click', () => {
        tierOptions.style.display = tierOptions.style.display === 'block' ? 'none' : 'block';
    });
    
    document.querySelectorAll('.tier-options div').forEach(option => {
        option.addEventListener('click', () => {
            const tier = option.dataset.tier;
            filterByTier(tier);
            tierOptions.style.display = 'none';
        });
    });
}

function filterByTier(tier) {
    const cards = document.querySelectorAll('.pokemon-card');
    
    if (tier === 'gen9ou') {
        cards.forEach(card => {
            const img = card.querySelector('.pokemon-img');
            const pokemonName = img.src.split('/').pop().replace('.png', '');
            
            card.style.display = GEN9OU_POKEMON.includes(pokemonName) ? 'block' : 'none';
        });
    } else {
        // 显示所有精灵
        cards.forEach(card => {
            card.style.display = 'block';
        });
    }
}

export { setupTierSelector };