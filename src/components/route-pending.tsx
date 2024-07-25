import { type RouteComponent } from '@tanstack/react-router';
import { Center } from 'styled-system/jsx';

export const RoutePending: RouteComponent = () => {
  return <Center minH="96">Loading...</Center>;
};
