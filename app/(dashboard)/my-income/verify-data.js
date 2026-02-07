/**
 * 我的收入功能 - 数据验证脚本
 * 
 * 使用方法：
 * 1. 打开浏览器控制台 (F12)
 * 2. 复制整个文件内容并粘贴到控制台
 * 3. 按回车执行
 * 4. 查看验证结果
 */

(function() {
  console.log('==========================================');
  console.log('🔍 我的收入功能 - 数据验证');
  console.log('==========================================\n');

  // 检查 localStorage 中的数据
  const incomeRecordsStr = localStorage.getItem('eduflow:income-records');
  
  if (!incomeRecordsStr) {
    console.error('❌ 未找到收入记录数据！');
    console.log('💡 解决方案：刷新页面让系统自动初始化数据');
    return;
  }

  let incomeRecords;
  try {
    incomeRecords = JSON.parse(incomeRecordsStr);
  } catch (e) {
    console.error('❌ 数据解析失败！', e);
    return;
  }

  console.log(`✅ 总记录数: ${incomeRecords.length} 条\n`);

  // 按用户统计
  const userStats = {};
  const typeStats = { TRIAL_FEE: 0, DEAL_REWARD: 0, LESSON_FEE: 0 };
  const statusStats = { PENDING: 0, SETTLED: 0 };

  incomeRecords.forEach(record => {
    // 用户统计
    if (!userStats[record.teacherId]) {
      userStats[record.teacherId] = {
        name: record.teacherName,
        count: 0,
        total: 0,
        types: { TRIAL_FEE: 0, DEAL_REWARD: 0, LESSON_FEE: 0 }
      };
    }
    userStats[record.teacherId].count++;
    userStats[record.teacherId].total += record.amount;
    userStats[record.teacherId].types[record.type]++;

    // 类型统计
    typeStats[record.type]++;

    // 状态统计
    statusStats[record.status]++;
  });

  // 显示各用户数据
  console.log('📊 用户收入统计：');
  console.log('─'.repeat(80));
  
  const expectedUsers = {
    'user-tutor-1': { name: '李伴学', role: 'TUTOR', expected: 18 },
    'user-tutor-2': { name: '王金牌', role: 'TUTOR', expected: 5 },
    'user-tutor-3': { name: '刘资深', role: 'TUTOR', expected: 4 },
    'user-manager-1': { name: '王学管', role: 'MANAGER', expected: 4 }
  };

  Object.entries(expectedUsers).forEach(([userId, info]) => {
    const stats = userStats[userId];
    if (stats) {
      const status = stats.count === info.expected ? '✅' : '⚠️';
      console.log(`${status} ${info.name} (${info.role})`);
      console.log(`   ID: ${userId}`);
      console.log(`   记录数: ${stats.count} 条 (预期 ${info.expected})`);
      console.log(`   总金额: ¥${stats.total.toLocaleString()}`);
      console.log(`   试课费: ${stats.types.TRIAL_FEE} 笔`);
      console.log(`   成交奖励: ${stats.types.DEAL_REWARD} 笔`);
      console.log(`   课时费: ${stats.types.LESSON_FEE} 笔\n`);
    } else {
      console.error(`❌ ${info.name} (${userId}) - 未找到数据！\n`);
    }
  });

  // 全局统计
  console.log('─'.repeat(80));
  console.log('📈 全局统计：');
  console.log(`   试课费: ${typeStats.TRIAL_FEE} 笔`);
  console.log(`   成交奖励: ${typeStats.DEAL_REWARD} 笔`);
  console.log(`   课时费: ${typeStats.LESSON_FEE} 笔`);
  console.log(`   已结算: ${statusStats.SETTLED} 笔`);
  console.log(`   待结算: ${statusStats.PENDING} 笔\n`);

  // 数据完整性检查
  console.log('─'.repeat(80));
  console.log('🔎 数据完整性检查：');
  
  const checks = [
    { 
      name: '总记录数', 
      actual: incomeRecords.length, 
      expected: 31, 
      pass: incomeRecords.length === 31 
    },
    { 
      name: '李伴学记录数', 
      actual: userStats['user-tutor-1']?.count || 0, 
      expected: 18, 
      pass: userStats['user-tutor-1']?.count === 18 
    },
    { 
      name: '王金牌记录数', 
      actual: userStats['user-tutor-2']?.count || 0, 
      expected: 5, 
      pass: userStats['user-tutor-2']?.count === 5 
    },
    { 
      name: '刘资深记录数', 
      actual: userStats['user-tutor-3']?.count || 0, 
      expected: 4, 
      pass: userStats['user-tutor-3']?.count === 4 
    },
    { 
      name: '王学管记录数', 
      actual: userStats['user-manager-1']?.count || 0, 
      expected: 4, 
      pass: userStats['user-manager-1']?.count === 4 
    }
  ];

  let allPass = true;
  checks.forEach(check => {
    const status = check.pass ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${check.actual} (预期 ${check.expected})`);
    if (!check.pass) allPass = false;
  });

  console.log('\n' + '─'.repeat(80));
  if (allPass) {
    console.log('✅ 所有检查通过！数据完整且正确。');
  } else {
    console.log('⚠️ 部分检查失败，建议清除数据重新加载：');
    console.log('   执行: localStorage.removeItem("eduflow:income-records"); location.reload();');
  }

  console.log('==========================================\n');

  // 返回统计数据供进一步分析
  return {
    totalRecords: incomeRecords.length,
    userStats,
    typeStats,
    statusStats,
    allChecksPass: allPass
  };
})();
