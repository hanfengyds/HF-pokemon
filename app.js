const MAX_TEAM_SIZE = 6;

function setupDragAndDrop() {
  const cards = document.querySelectorAll('.pokemon-card');
  const redTeam = document.getElementById('redTeam');
  const blueTeam = document.getElementById('blueTeam');

  cards.forEach(card => {
    card.setAttribute('draggable', true);
    
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.id);
    });
  });

  [redTeam, blueTeam].forEach(team => {
    team.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    team.addEventListener('drop', (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('text/plain');
      const card = document.getElementById(cardId);
      
      if (team.children.length < MAX_TEAM_SIZE) {
        moveToTeam(card, team);
      }
    });

    team.addEventListener('click', (e) => {
      if (e.target.classList.contains('pokemon-card')) {
        moveToPool(e.target);
      }
    });
  });
}

function moveToTeam(card, team) {
  // 隐藏属性标签
  const typeTags = card.querySelector('.type-tags');
  if (typeTags) {
    typeTags.style.display = 'none';
  }
  team.appendChild(card);
}

function moveToPool(card) {
  // 显示属性标签
  const typeTags = card.querySelector('.type-tags');
  if (typeTags) {
    typeTags.style.display = 'block';
  }
  const pool = document.getElementById('cardPool');
  if (pool.firstChild) {
    pool.insertBefore(card, pool.firstChild);
  } else {
    pool.appendChild(card);
  }
}

// 修改loadPokemonCards函数，为每张卡添加ID和拖拽支持
async function loadPokemonCards() {
  try {
    const response = await fetch('pokemon_full_list.json');
    const data = await response.json();
    const container = document.getElementById('cardPool');

    data.forEach((pokemon, index) => {
      const card = document.createElement('div');
      card.className = 'pokemon-card';
      
      const img = document.createElement('img');
      img.className = 'pokemon-img';
      img.src = `pokemon/${pokemon.name_en}.png`;
      img.alt = pokemon.name;

      // 添加右键事件监听器
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleDisableCard(card);
      });

      // 添加属性标签
      const typeTags = document.createElement('div');
      typeTags.className = 'type-tags';
      pokemon.types.forEach(type => {
          const tag = document.createElement('span');
          tag.textContent = type;
          tag.setAttribute('data-type', type);
          typeTags.appendChild(tag);
      });
  
      card.appendChild(img);
      card.appendChild(typeTags);
      container.appendChild(card);
      card.id = `pokemon-card-${index}`;
    });
    // 在setupDragAndDrop函数中添加卡池的拖拽支持
    const cardPool = document.getElementById('cardPool');
    cardPool.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    cardPool.addEventListener('drop', (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('text/plain');
      const card = document.getElementById(cardId);
      moveToPool(card);
    });
    setupDragAndDrop();
    setupSearch();
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

function toggleDisableCard(card) {
  card.classList.toggle('disabled');
  card.setAttribute('draggable', !card.classList.contains('disabled'));
}

// 页面加载完成后执行
window.onload = loadPokemonCards;

// 添加搜索功能
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const cards = document.querySelectorAll('.pokemon-card');

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    cards.forEach(card => {
      const img = card.querySelector('.pokemon-img');
      const name = img.alt.toLowerCase();
      const nameEn = img.src.split('/').pop().replace('.png', '').toLowerCase();
      
      if (name.includes(searchTerm) || nameEn.includes(searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}


