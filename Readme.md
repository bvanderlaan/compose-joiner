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

## Usage

You can use this tool either as a module imported into your Node script _or_ via its command line interface (CLI).

### CLI

This tool has a command line interface to trigger the docker-compose editing via a bash script.
The idea for me is that I can add a bash script command to my CI job to create my new one docker-compose file to rule them all on the fly.

The CLI is broken out into sub commands which either take a path to the YAMl file or the json blob.

```
compose-joiner [parse|update|remove] <path to compose file | json blob of compose file data>
```

**Example**
```
> compose-joiner parse docker-compose.base-infrastructure.yml
  | xargs compose-joiner remove nginx
  | xargs compose-joiner remove dns-service
  | xargs compose-joiner join docker-compose.micro-service1.yml
  | xargs compose-joiner save docker-compose.master.yml
```


#### Adding Property to Service

The CLI has a command for adding or updating a property on a service: `compose-joiner property`.

The command takes three arguments and has two optional flags.
```
  compose-joiner property <service-name> <property-name> <compose-blob>
  compose-joiner property <service-name> <property-name> <compose-blob> -D|--remove
  compose-joiner property <service-name> <property-name> <compose-blob> -a|--add <value>
```

If you call the command with no flags it will display the value of the give property. If the property does not exist it will display `undefined`.

> service-name.property-name = value
> service-name.property-name = undefined

```
  compose-joiner parse docker-compose.yml \
    | xargs compose-joiner property my-service hello

    my-service.hello = 'world'
```

If you use the `-D` flag or the `--remove` flag it will return a new compose blob which no longer includes the property on the selected service.

```
  compose-joiner parse docker-compose.yml \
    | xargs compose-joiner property my-service hello -D
```

If you use the `-a` or `--add` flag it will _update_ the value of the property of the given service or add it if the property does not already exist.

```
  compose-joiner parse docker-compose.yml \
    | xargs compose-joiner property my-service hello --add 42
```

To add a JSON array you need to escape the quotation characters otherwise it will be read in as a string.

```
  compose-joiner parse docker-compose.yml \
    | xargs compose-joiner property my-service hello --add [\"42:42\"]
```

## Running Tests

To run the tests suite use the `npm test` command.
Make sure to run `npm install` first.

You can have the tests watch for changes and re-run automatically by using the command `npm run watch`.

## Contributing

Bug reports and pull requests are welcome. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](https://contributor-covenant.org/) code of conduct.

## License

The tool is available as open source under the terms of the [MIT License](https://choosealicense.com/licenses/mit/).