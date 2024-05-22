FROM tomcat:9-jdk8-temurin-jammy AS base
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN apt-get update && apt-get install --yes --no-install-recommends \
        ca-certificates \
        curl \
        git \
        gnupg \
    ; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list; \
    apt-get update && apt-get install --yes --no-install-recommends nodejs; \
    npm install -g yarn;

FROM base AS plugin
RUN git clone --depth=1 --branch=3.6.1 https://bitbucket.org/icrimaginginformatics/ohif-viewer-xnat-plugin.git /plugin
COPY run.sh /
ENTRYPOINT ["/run.sh"]
