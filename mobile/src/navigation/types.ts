import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Properties: undefined;
  Investments: undefined;
  Community: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  PropertyDetail: { id: string };
  InvestmentDetail: { id: string };
  Settings: undefined;
  EditProfile: undefined;
  Messages: undefined;
  Conversation: { conversationId: string; name: string };
  Notifications: undefined;
  FinancialDashboard: undefined;
  CreatePost: undefined;
  PostDetail: { id: string };
  GroupDetail: { id: string };
  CreateGroup: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
