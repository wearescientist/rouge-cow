<template>
  <div class="weapons-page">
    <div class="page-header">
      <h2>⚔️ 武器系统</h2>
      <el-button type="primary" @click="saveChanges" :loading="saving">
        <el-icon><Check /></el-icon>
        保存修改
      </el-button>
    </div>

    <el-row :gutter="20">
      <!-- 武器列表 -->
      <el-col :span="8">
        <el-card class="weapon-list-card">
          <template #header>
            <div class="card-header">
              <span>武器列表</span>
              <el-input
                v-model="filterText"
                placeholder="筛选..."
                size="small"
                clearable
                style="width: 120px"
              />
            </div>
          </template>
          <el-menu
            :default-active="selectedWeapon?.id"
            @select="handleSelect"
            class="weapon-menu"
          >
            <el-menu-item 
              v-for="weapon in filteredWeapons" 
              :key="weapon.id"
              :index="weapon.id"
            >
              <el-icon><Aim /></el-icon>
              <span>{{ weapon.name }}</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 武器详情 -->
      <el-col :span="16" v-if="selectedWeapon">
        <el-card class="weapon-detail-card">
          <template #header>
            <div class="card-header">
              <span>{{ selectedWeapon.name }} - 属性配置</span>
              <el-tag :type="getWeaponTypeTag(selectedWeapon.type)">
                {{ selectedWeapon.type }}
              </el-tag>
            </div>
          </template>

          <el-form :model="selectedWeapon" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="基础伤害">
                  <el-input-number 
                    v-model="selectedWeapon.damage" 
                    :min="1" 
                    :max="1000"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="冷却时间(帧)">
                  <el-input-number 
                    v-model="selectedWeapon.cooldown" 
                    :min="1" 
                    :max="300"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="弹速">
                  <el-input-number 
                    v-model="selectedWeapon.speed" 
                    :min="1" 
                    :max="50"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="射程">
                  <el-input-number 
                    v-model="selectedWeapon.range" 
                    :min="50" 
                    :max="2000"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="穿透数">
                  <el-input-number 
                    v-model="selectedWeapon.pierce" 
                    :min="0" 
                    :max="10"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="投射物数">
                  <el-input-number 
                    v-model="selectedWeapon.projectileCount" 
                    :min="1" 
                    :max="20"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider />

            <!-- DPS 计算 -->
            <div class="dps-calc">
              <h4>📊 DPS 计算</h4>
              <el-descriptions :column="3" border>
                <el-descriptions-item label="理论DPS">
                  {{ calculatedDPS.toFixed(1) }}
                </el-descriptions-item>
                <el-descriptions-item label="每秒攻击">
                  {{ attacksPerSecond.toFixed(2) }}
                </el-descriptions-item>
                <el-descriptions-item label="总伤害">
                  {{ totalDamage }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-form>
        </el-card>

        <!-- 升级配置 -->
        <el-card class="upgrade-card" style="margin-top: 20px">
          <template #header>
            <span>⬆️ 升级配置</span>
          </template>
          <el-table :data="upgradeLevels" border size="small">
            <el-table-column prop="level" label="等级" width="80" />
            <el-table-column prop="damage" label="伤害" />
            <el-table-column prop="cost" label="升级成本" />
            <el-table-column prop="dps" label="DPS" />
          </el-table>
        </el-card>
      </el-col>

      <!-- 未选择武器 -->
      <el-col :span="16" v-else>
        <el-empty description="请从左侧选择一个武器" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { ElMessage } from 'element-plus'

const dataStore = useDataStore()

const selectedWeapon = ref(null)
const filterText = ref('')
const saving = ref(false)

const filteredWeapons = computed(() => {
  let list = dataStore.weaponList
  if (filterText.value) {
    const lower = filterText.value.toLowerCase()
    list = list.filter(w => 
      w.name?.toLowerCase().includes(lower) ||
      w.id?.toLowerCase().includes(lower)
    )
  }
  return list
})

const calculatedDPS = computed(() => {
  if (!selectedWeapon.value) return 0
  const weapon = selectedWeapon.value
  const attacksPerSec = 60 / (weapon.cooldown || 60)
  const totalDmg = (weapon.damage || 0) * (weapon.projectileCount || 1)
  return totalDmg * attacksPerSec
})

const attacksPerSecond = computed(() => {
  if (!selectedWeapon.value) return 0
  return 60 / (selectedWeapon.value.cooldown || 60)
})

const totalDamage = computed(() => {
  if (!selectedWeapon.value) return 0
  return (selectedWeapon.value.damage || 0) * (selectedWeapon.value.projectileCount || 1)
})

const upgradeLevels = computed(() => {
  if (!selectedWeapon.value) return []
  
  const levels = []
  const baseDamage = selectedWeapon.value.damage || 10
  const baseCost = 100
  
  for (let i = 1; i <= 5; i++) {
    const multiplier = 1 + (i - 1) * 0.3
    const damage = Math.round(baseDamage * multiplier)
    const cost = Math.round(baseCost * Math.pow(1.5, i - 1))
    const dps = (damage * attacksPerSecond.value).toFixed(1)
    
    levels.push({
      level: i,
      damage,
      cost,
      dps
    })
  }
  
  return levels
})

const handleSelect = (index) => {
  selectedWeapon.value = dataStore.weapons.find(w => w.id === index)
}

const getWeaponTypeTag = (type) => {
  const map = {
    melee: 'danger',
    ranged: 'primary',
    magic: 'warning'
  }
  return map[type] || 'info'
}

const saveChanges = () => {
  dataStore.exportData('weapons', dataStore.weapons)
  ElMessage.success('已导出 weapons.json')
}

onMounted(() => {
  if (dataStore.weapons.length === 0) {
    dataStore.loadWeapons()
  }
  if (filteredWeapons.value.length > 0) {
    selectedWeapon.value = filteredWeapons.value[0]
  }
})
</script>

<style lang="scss" scoped>
.weapons-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weapon-list-card {
  .weapon-menu {
    border-right: none;
    max-height: 600px;
    overflow-y: auto;
  }
}

.weapon-detail-card {
  .dps-calc {
    margin-top: 20px;
    
    h4 {
      margin-bottom: 12px;
    }
  }
}

.upgrade-card {
  margin-top: 20px;
}
</style>
