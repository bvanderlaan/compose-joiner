# Compose-Joiner

This is a tool used to upgrade, inspect, and concatenate docker-compose yaml files.

This is born out of a need I had to generate a single docker-compose file from a collection of compose files.

## Backstory

On my team we developed a cloud based service; we do not use docker in production :cry: (yet?) but do use docker to spin up the SaaS platform for local development on our dev machines.

For reasons I'm not sure are correct but never the less is the state of things currently instead of spinning up a new database container for each micro-service we host a single database container which hosts multiple databases. This simulates more closely our non-containerized production environment but I do believe the actual concern was lessening the foot print of running multiple database containers ona  single underpowered development laptop. I'm not sure if we would have ran into resource limitations hosting each micro-services database on its own container vs. a single container but that is the way we are setup currently.

This means that we have one compose file to bring up our _base infrastructure_ and other compose files for each micro-service.

Because this all pre-dated docker-compose version 2+ to allow for service discovery the base infrastructure also brings up a DNS and nginx containers.

## My Issue

I was tasked with getting our CI setup to be able to bring up the entire containerized platform so that we can run automated system level tests which execute the system as a whole from end to end. The problem was that not only could I have to execute multiple `docker-compose up` commands  (minor issue I know) but our DNS and nginx containers were hard coded to work within our Vagrant and don't work that well on the CI server itself.

## My Solution

There were many approaches I could have taken to solve this but I thought best to utilize docker-compose version 2+'s networking features and simply build a single docker-compose file to bring up the whole platform.

Because I didn't want to force my team mates to change their workflow nor did I want to duplicate compose-files (we document our environment variables there) I opted to write a tool which could dynamically at each run of the job pull in all our docker-compose files and concatenate them into a single docker-compose file then use that to launch the platform for testing.

That is what this tool will be used for.

## Disclaimer

I wrote this tool for my specific need and might not work for everyone, I make no claims that it will join the compose files correctly across all versions of the file format just that it works for me and will be updated only when it stops working or abandoned if no longer required.

## Running Tests

To run the tests suite use the `npm test` command.
Make sure to run `npm install` first.

You can have the tests watch for changes and re-run automatically by using the command `npm run watch`.

## Contributing

Bug reports and pull requests are welcome. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](https://contributor-covenant.org/) code of conduct.

## License

The tool is available as open source under the terms of the [ISC License](https://choosealicense.com/licenses/isc/).