﷽
# MSOCIETY Bot
![CI](https://github.com/SGTinkers/msocietybot/workflows/CI/badge.svg)
![Dependencies](https://david-dm.org/SGTinkers/msocietybot.svg)
[![codecov](https://codecov.io/gh/SGTinkers/msocietybot/branch/master/graph/badge.svg)](https://codecov.io/gh/SGTinkers/msocietybot)
[![Known Vulnerabilities](https://snyk.io/test/github/SGTinkers/msocietybot/badge.svg?targetFile=package.json)](https://snyk.io/test/github/SGTinkers/msocietybot?targetFile=package.json)

A unified platform to manage MSOCIETY community.

This project is rewritten to Typescript from Go: https://gitlab.com/msociety/msocietybot

## Running

1. Run `npm i` command
2. Copy `env.sample` to `.env`
3. Setup database settings inside `.env` file
4. [Create new bot](https://core.telegram.org/bots#6-botfather) and add token to `.env` file
5. Run `npm start` command

### Output verbose logging
You can turn on debug (verbose) logging via supplying the env `DEBUG`:
```bash
$ DEBUG=telegraf:client,msocietybot npm run start
```

### Running (with Docker)

```bash
# First time only:
$ docker-compose run database # Shut down after database has been set up

# Every other time:
$ docker-compose up
```

## Contributing

### Running tests
```bash
$ npm run test
```

### Migration scripts
Migration scripts can be automatically generated by TypeORM:
```bash
$ npm run create-migration {migrationName}
```
It will work correctly as long as you have a db running with the latest migrations applied. TypeORM will calculate the differences using the schema to generate the new migrations.

### Migration scripts for tests
Due to an issue with TypeORM (sqlite) when doing recursive relationships (e.g. Message -> Message), the `syncronize` flag does not work and hence we have to also use migration scripts for testing:
```bash
$ npm run test:create-migration {migrationName}
# modify the generated migration scripts as per below *
$ npm run test:migrate
# above command is needed to update migration.db for tracking changes
```
\* When generating migration scripts for test, ensure any lines related to `temporary_messages` are removed.

