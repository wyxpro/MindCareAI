import HomePage from './pages/HomePage';
import RecordPageNew from './pages/RecordPageNew';
import EnhancedAssessmentPage from './pages/EnhancedAssessmentPage';
import HealingPageNew from './pages/HealingPageNew';
import ProfilePageRedesigned from './pages/ProfilePageRedesigned';
import LoginPage from './pages/LoginPage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import HealingPlanPage from './pages/HealingPlanPage';
import ConnectDoctorPage from './pages/ConnectDoctorPage';
import AboutUsPage from './pages/AboutUsPage';
import DoctorDashboardPage from './pages/doctor/DashboardPage';
import DoctorPatientsPage from './pages/doctor/PatientsPage';
import DoctorKnowledgePage from './pages/doctor/KnowledgePage';
import DoctorAlertsPage from './pages/doctor/AlertsPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  // 用户端路由
  {
    name: '首页',
    path: '/',
    element: <HomePage />,
  },
  {
    name: '记录',
    path: '/record',
    element: <RecordPageNew />,
  },
  {
    name: '评估',
    path: '/assessment',
    element: <EnhancedAssessmentPage />,
  },
  {
    name: '疗愈',
    path: '/healing',
    element: <HealingPageNew />,
  },
  {
    name: '我的',
    path: '/profile',
    element: <ProfilePageRedesigned />,
  },
  {
    name: '个人信息',
    path: '/profile/personal',
    element: <PersonalInfoPage />,
    visible: false,
  },
  {
    name: '隐私设置',
    path: '/profile/privacy',
    element: <PrivacySettingsPage />,
    visible: false,
  },
  {
    name: '会员订阅',
    path: '/profile/subscription',
    element: <SubscriptionPage />,
    visible: false,
  },
  {
    name: '疗愈计划',
    path: '/profile/healing-plan',
    element: <HealingPlanPage />,
    visible: false,
  },
  {
    name: '对接医生',
    path: '/profile/connect-doctor',
    element: <ConnectDoctorPage />,
    visible: false,
  },
  {
    name: '关于我们',
    path: '/profile/about',
    element: <AboutUsPage />,
    visible: false,
  },
  // 登录
  {
    name: '登录',
    path: '/login',
    element: <LoginPage />,
    visible: false,
  },
  // 医生后台路由
  {
    name: '医生数据看板',
    path: '/doctor/dashboard',
    element: <DoctorDashboardPage />,
    visible: false,
  },
  {
    name: '患者管理',
    path: '/doctor/patients',
    element: <DoctorPatientsPage />,
    visible: false,
  },
  {
    name: '知识库',
    path: '/doctor/knowledge',
    element: <DoctorKnowledgePage />,
    visible: false,
  },
  {
    name: '预警消息',
    path: '/doctor/alerts',
    element: <DoctorAlertsPage />,
    visible: false,
  },
];

export default routes;
