import 'dotenv/config';
import { verifyKey } from 'discord-interactions';
import {
  APIApplicationCommand,
  REST,
  RESTGetAPIOAuth2CurrentAuthorizationResult,
  Routes,
} from 'discord.js';
import { DiscordUser } from './user-db/models/discord-user';

export const restClient = new REST({ version: '10' }).setToken(
  process.env.DISCORD_TOKEN
);

export function VerifyDiscordRequest(clientKey) {
  return function (req, res, buf, encoding) {
    const signature = req.get('X-Signature-Ed25519');
    const timestamp = req.get('X-Signature-Timestamp');

    const isValidRequest = verifyKey(buf, signature, timestamp, clientKey);
    if (!isValidRequest) {
      res.status(401).send('Bad request signature');
      throw new Error('Bad request signature');
    }
  };
}

export async function RegisterCommand(
  commands: APIApplicationCommand[]
): Promise<void> {
  try {
    await restClient.put(Routes.applicationCommands(process.env.APP_ID), {
      body: commands,
    });
    console.log('Install complete');
  } catch (err) {
    console.error('Install failed: ', err);
  }
}

export async function getUserMe(accessToken: string): Promise<DiscordUser> {
  try {
    const user = (await getRESTClient(accessToken).get(
      Routes.oauth2CurrentAuthorization()
    )) as RESTGetAPIOAuth2CurrentAuthorizationResult;

    return {
      id: user.user.id,
      name: user.user.global_name,
      username: user.user.username,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

function getRESTClient(accessToken: string): REST {
  return new REST({ version: '10', authPrefix: 'Bearer' }).setToken(
    accessToken
  );
}
