/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import 'fast-text-encoding';
import App from './App';
import { name as appName } from './app.json';

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
    'This method is deprecated',
]);

AppRegistry.registerComponent(appName, () => App);
