import { WelcomeExampleBot } from './examples/WelcomeExample';
import { SceneExampleBot } from './examples/SceneExample';
import { DebugBot } from './helpers/Debug';
import { CommonHelper } from './helpers/Common';
import { ScriberBot } from './Scriber';
import { ReputationBot } from './Reputation';

export const Bots = {
  CommonHelper,
  DebugBot,
  ScriberBot,
  ReputationBot,
};

export const ExampleBots = {
  WelcomeExampleBot,
  SceneExampleBot,
};
