# 我的收入功能说明

## 功能概述

"我的收入"页面为伴学教练和学管提供个人收入管理功能，包括：
- 试课费
- 成交奖励
- 课时费

## 数据查看

### 登录用户说明

系统已为以下用户创建了 Mock 收入数据：

1. **李伴学** (user-tutor-1, 手机: 13800002001)
   - 试课费: 5笔 (3笔已结算, 2笔待结算)
   - 成交奖励: 3笔 (2笔已结算, 1笔待结算)
   - 课时费: 10笔 (7笔已结算, 3笔待结算)

2. **王金牌** (user-tutor-2, 手机: 13800002002)
   - 试课费: 2笔
   - 成交奖励: 1笔
   - 课时费: 2笔

3. **刘资深** (user-tutor-3, 手机: 13800002003)
   - 试课费: 1笔
   - 成交奖励: 1笔
   - 课时费: 2笔

4. **王学管** (user-manager-1, 手机: 13800003001)
   - 试课费: 1笔
   - 课时费: 3笔

### 如何查看数据

1. 使用上述任一账号登录系统
2. 在左侧导航栏点击"我的收入"菜单
3. 默认显示本月的收入记录

### 如果看不到数据

如果页面显示"暂无收入记录"，请按以下步骤操作：

1. **清除浏览器缓存数据**
   - 打开浏览器开发者工具 (F12)
   - 切换到 "Application" 或 "应用" 标签
   - 在左侧找到 "Local Storage"
   - 找到 `eduflow:income-records` 键并删除
   - 刷新页面

2. **或者清除所有 eduflow 数据**
   ```javascript
   // 在浏览器控制台执行
   Object.keys(localStorage).forEach(key => {
     if (key.startsWith('eduflow:')) {
       localStorage.removeItem(key);
     }
   });
   location.reload();
   ```

## 功能特性

### 1. 筛选功能
- **日期范围**: 选择开始时间和结束时间
- **记录类型**: 全部/试课费/成交奖励/课时费
- **快捷选择**: 本月、上月、近三月

### 2. 统计卡片
- **总收入**: 所有类型收入总和
- **试课费**: 金额总计 + 笔数
- **成交奖励**: 金额总计 + 笔数
- **课时费**: 金额总计 + 课时数

### 3. 记录列表
- 显示每条收入记录的详细信息
- 支持分页查看 (每页20条)
- 可查看课时费对应的课后反馈

### 4. 其他功能
- **刷新**: 重新加载最新数据
- **导出对账单**: 导出 Excel 文件 (开发中)
- **查看详情**: 点击课时费记录可查看对应的课后反馈

## 数据模型

### 收入类型 (IncomeType)
- `TRIAL_FEE`: 试课费
- `DEAL_REWARD`: 成交奖励
- `LESSON_FEE`: 课时费

### 结算状态 (IncomeStatus)
- `PENDING`: 待结算
- `SETTLED`: 已结算

### 收入记录 (IncomeRecord)
```typescript
{
  id: string
  type: IncomeType
  teacherId: string
  teacherName: string
  studentId?: string
  studentName?: string
  orderId?: string          // 成交奖励关联订单号
  feedbackId?: string       // 课时费关联课后反馈ID
  courseName?: string       // 课时费课程名称
  quantity: number          // 数量(次数/单数/课时数)
  unitPrice: number         // 单价
  amount: number            // 收入金额
  status: IncomeStatus
  remarks?: string
  occurredAt: Date          // 发生时间
  settledAt?: Date          // 结算时间
  createdAt: Date
  updatedAt: Date
}
```

## 价格配置

收入金额基于以下配置：

- **试课费**: ¥200/次 (固定)
- **成交奖励**: 从价格配置表的 `trialReward` 字段读取 (¥30-60/单)
- **课时费**: 从价格配置表的 `regularPrice` 字段读取 (¥150-220/课时)

## 结算规则

- 每月10号，运营人员会手动批量结算上月收入
- 结算后的记录状态变为"已结算"，并记录结算时间

## 技术实现

- **数据存储**: LocalStorage (生产环境需替换为真实 API)
- **数据文件**: `/lib/mock-data/income-records.ts`
- **类型定义**: `/types/index.ts`
- **页面路径**: `/app/(dashboard)/my-income/page.tsx`

## 后续优化

1. 实现真实的后端 API
2. 完成导出对账单功能
3. 添加收入趋势图表
4. 支持按月/季度/年度统计
5. 添加收入详情弹窗
6. 支持收入记录的搜索和排序
