import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDataStore = defineStore('data', () => {
  // 状态
  const enemyTypes = ref({})
  const spriteMetadata = ref({})
  const weapons = ref([])
  const items = ref([])
  const audioFiles = ref([])
  const hd2dConfig = ref({})
  const logs = ref([])
  const loading = ref(false)
  const dataInconsistencies = ref([])

  // 计算属性
  const enemyList = computed(() => {
    return Object.entries(enemyTypes.value).map(([key, data]) => ({
      key,
      ...data
    }))
  })

  const weaponList = computed(() => weapons.value)
  const itemList = computed(() => items.value)

  // 加载所有数据
  const loadAllData = async () => {
    loading.value = true
    try {
      await Promise.all([
        loadEnemyTypes(),
        loadSpriteMetadata(),
        loadMockData()
      ])
      checkDataConsistency()
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 加载敌人数据
  const loadEnemyTypes = async () => {
    try {
      const response = await fetch('/data/enemies/index.js')
      if (!response.ok) throw new Error('文件不存在')
      
      const text = await response.text()
      // 解析 ENEMY_TYPES 对象
      const match = text.match(/const\s+ENEMY_TYPES\s*=\s*({[\s\S]*?});?\s*$/m)
      if (match) {
        const parseFunc = new Function(`return ${match[1]}`)
        enemyTypes.value = parseFunc()
        console.log('敌人数据加载成功:', Object.keys(enemyTypes.value).length, '个')
      }
    } catch (error) {
      console.error('加载敌人数据失败:', error)
      enemyTypes.value = {}
    }
  }

  // 加载贴图元数据
  const loadSpriteMetadata = async () => {
    try {
      const response = await fetch('/assets/sprites/metadata.json')
      if (!response.ok) throw new Error('文件不存在')
      spriteMetadata.value = await response.json()
      console.log('贴图元数据加载成功:', Object.keys(spriteMetadata.value).length, '个')
    } catch (error) {
      console.error('加载贴图元数据失败:', error)
      spriteMetadata.value = {}
    }
  }

  // 模拟数据（武器、音频等）
  const loadMockData = async () => {
    // 武器数据 - 基于游戏实际武器系统
    weapons.value = [
      { id: 'sword', name: '铁剑', damage: 25, cooldown: 30, speed: 8, range: 100, pierce: 0, projectileCount: 1, type: 'melee' },
      { id: 'gun', name: '手枪', damage: 15, cooldown: 15, speed: 15, range: 400, pierce: 1, projectileCount: 1, type: 'ranged' },
      { id: 'shotgun', name: '霰弹枪', damage: 12, cooldown: 45, speed: 10, range: 250, pierce: 0, projectileCount: 5, type: 'ranged' },
      { id: 'staff', name: '法杖', damage: 40, cooldown: 60, speed: 6, range: 300, pierce: 3, projectileCount: 1, type: 'magic' }
    ]

    // 音频数据
    audioFiles.value = [
      { id: 'bgm_battle', name: '战斗BGM', category: 'bgm', volume: 70, loop: true, duration: 120, format: 'mp3' },
      { id: 'bgm_menu', name: '菜单BGM', category: 'bgm', volume: 60, loop: true, duration: 90, format: 'mp3' },
      { id: 'sfx_shoot', name: '射击音效', category: 'sfx', volume: 85, loop: false, duration: 0.5, format: 'wav' },
      { id: 'sfx_explosion', name: '爆炸音效', category: 'sfx', volume: 90, loop: false, duration: 1.2, format: 'wav' },
      { id: 'ui_click', name: '点击音效', category: 'ui', volume: 75, loop: false, duration: 0.1, format: 'ogg' },
      { id: 'ui_hover', name: '悬停音效', category: 'ui', volume: 50, loop: false, duration: 0.05, format: 'ogg' }
    ]

    // HD-2D 配置
    hd2dConfig.value = {
      backlight: { enabled: true, color: '#409EFF', intensity: 60, blur: 20, offsetX: 0, offsetY: -10 },
      shadow: { enabled: true, color: '#000000', opacity: 40, blur: 15, offsetX: 5, offsetY: 10 },
      outline: { enabled: true, width: 2, colorMode: 'tier' },
      bloom: { enabled: true, intensity: 30, radius: 50, threshold: 60 }
    }
  }

  // 导出数据为文件（下载方式）
  const exportData = (dataType, data) => {
    let content = ''
    let filename = ''
    let mimeType = 'application/javascript'

    switch (dataType) {
      case 'enemies':
        content = `const ENEMY_TYPES = ${JSON.stringify(data, null, 2)};\n\nexport default ENEMY_TYPES;`
        filename = 'index.js'
        break
      case 'sprites':
        content = JSON.stringify(data, null, 2)
        filename = 'metadata.json'
        mimeType = 'application/json'
        break
      default:
        content = JSON.stringify(data, null, 2)
        filename = `${dataType}.json`
        mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return true
  }

  // 数据一致性检查
  const checkDataConsistency = () => {
    const issues = []
    
    Object.entries(enemyTypes.value).forEach(([key, enemy]) => {
      if (!enemy.size) {
        issues.push({
          type: 'error',
          message: `敌人 "${key}" 缺少 size 属性`,
          entity: key,
          field: 'size'
        })
      }
      
      if (!enemy.tier) {
        issues.push({
          type: 'warning',
          message: `敌人 "${key}" 缺少 tier 属性`,
          entity: key,
          field: 'tier'
        })
      }
      
      // 检查贴图引用
      if (enemy.sprite && !spriteMetadata.value[enemy.sprite]) {
        issues.push({
          type: 'warning',
          message: `敌人 "${key}" 引用的贴图 "${enemy.sprite}" 未找到`,
          entity: key,
          field: 'sprite'
        })
      }
    })
    
    dataInconsistencies.value = issues
    return issues
  }

  // 搜索
  const search = (query) => {
    const results = []
    const lowerQuery = query.toLowerCase()
    
    Object.entries(enemyTypes.value).forEach(([key, enemy]) => {
      if (key.toLowerCase().includes(lowerQuery) || 
          enemy.name?.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'enemy', key, name: enemy.name || key, data: enemy })
      }
    })
    
    weapons.value.forEach(weapon => {
      if (weapon.name?.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'weapon', key: weapon.id, name: weapon.name, data: weapon })
      }
    })
    
    return results
  }

  return {
    // 状态
    enemyTypes,
    spriteMetadata,
    weapons,
    items,
    audioFiles,
    hd2dConfig,
    logs,
    loading,
    dataInconsistencies,
    
    // 计算属性
    enemyList,
    weaponList,
    itemList,
    
    // 方法
    loadAllData,
    loadEnemyTypes,
    loadSpriteMetadata,
    exportData,
    checkDataConsistency,
    search
  }
})
